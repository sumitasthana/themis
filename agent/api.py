"""
Themis Agent API Server

FastAPI server that exposes investigation endpoints and provides
real-time progress streaming for the Themis frontend.
"""

import json
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from orchestrator import ThemisAgent, run_investigation
from routes import router as data_router


# ═══════════════════════════════════════════════════════════════════
# FASTAPI APP SETUP
# ═══════════════════════════════════════════════════════════════════

app = FastAPI(
    title="Themis Agent API",
    description="AML Investigation Agent API with real-time streaming",
    version="1.0.0"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Phase 1 data routes (alerts, cases, customers, ...)
app.include_router(data_router)

# Global agent instance
agent: Optional[ThemisAgent] = None


# ═══════════════════════════════════════════════════════════════════
# REQUEST/RESPONSE MODELS
# ═══════════════════════════════════════════════════════════════════

class InvestigationRequest(BaseModel):
    alert_id: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "alert_id": "AML123456"
            }
        }


class InvestigationResponse(BaseModel):
    alert_id: str
    investigation_id: Optional[str] = None
    status: str
    recommendation: Optional[str]
    confidence: Optional[float]
    risk_score: Optional[Dict[str, Any]]
    journal: list
    narrative: Optional[str]
    errors: list
    completed_at: str


class ProgressUpdate(BaseModel):
    step: int
    step_name: str
    status: str
    message: str
    timestamp: str
    data: Optional[Dict[str, Any]] = None


# ═══════════════════════════════════════════════════════════════════
# STARTUP/SHUTDOWN
# ═══════════════════════════════════════════════════════════════════

@app.on_event("startup")
async def startup_event():
    """Initialize agent on startup"""
    global agent
    print("🚀 Initializing Themis Agent...")
    agent = ThemisAgent()
    print("✅ Themis Agent API ready")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("👋 Shutting down Themis Agent API")


# ═══════════════════════════════════════════════════════════════════
# API ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

@app.get("/")
async def root():
    """API health check"""
    return {
        "service": "Themis Agent API",
        "status": "running",
        "version": "1.0.0",
        "agent_ready": agent is not None,
        "skills_loaded": len(agent.skills) if agent else 0
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "agent_initialized": agent is not None
    }


@app.post("/api/investigate", response_model=InvestigationResponse)
async def investigate_alert(request: InvestigationRequest):
    """
    Run complete investigation for an alert
    
    This is a blocking endpoint that returns the complete investigation
    results after all steps are finished.
    """
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        print(f"\nStarting investigation for alert: {request.alert_id}")

        # Run investigation
        result = await agent.investigate_alert(request.alert_id)

        print(f"Investigation completed: {result['recommendation']}")
        
        return InvestigationResponse(**result)
        
    except Exception as e:
        print(f"❌ Investigation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/investigate/{alert_id}/stream")
async def investigate_alert_stream(alert_id: str):
    """
    Run investigation with real-time progress streaming
    
    Returns Server-Sent Events (SSE) stream with progress updates
    for each investigation step.
    """
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    async def generate_progress():
        """Generate SSE progress updates"""
        import uuid
        from datetime import timezone

        investigation_id = str(uuid.uuid4())
        started_at = datetime.now(timezone.utc)
        try:
            # Send start event
            yield f"data: {json.dumps({'type': 'start', 'alert_id': alert_id, 'investigation_id': investigation_id, 'timestamp': datetime.now().isoformat()})}\n\n"

            # Initialize state
            state = {
                "alert_id": alert_id,
                "investigation_id": investigation_id,
                "alert_details": None,
                "customer_profile": None,
                "transactions": None,
                "network_analysis": None,
                "baseline_analysis": None,
                "sanctions_results": None,
                "keyword_results": None,
                "income_verification": None,
                "risk_factors": {},
                "risk_score": None,
                "journal_entries": [],
                "current_step": "init",
                "completed_steps": [],
                "errors": [],
                "recommendation": None,
                "confidence": None,
                "narrative": None
            }
            
            # Execute investigation steps with progress updates
            steps = [
                ("step_1", "Alert Details Retrieval", agent._step_1_alert_details),
                ("step_2", "Customer Profile Review", agent._step_2_customer_profile),
                ("step_3", "Transaction History Search", agent._step_3_transactions),
                ("step_4", "Baseline Calculation", agent._step_4_baseline),
                ("step_5", "Income Verification", agent._step_5_income),
                ("step_6", "Keyword Search", agent._step_6_keywords),
                ("step_7", "Network Analysis", agent._step_7_network),
                ("step_8", "Sanctions Screening", agent._step_8_sanctions),
                ("step_9", "Risk Score Calculation", agent._step_9_risk_score),
                ("step_10", "Narrative Generation", agent._step_10_narrative),
            ]
            
            for step_num, (step_id, step_name, step_func) in enumerate(steps, 1):
                # Send step start
                yield f"data: {json.dumps({'type': 'step_start', 'step': step_num, 'step_name': step_name, 'timestamp': datetime.now().isoformat()})}\n\n"

                # Execute step (now async)
                state = await step_func(state)
                
                # Get latest journal entry
                latest_entry = state["journal_entries"][-1] if state["journal_entries"] else None
                
                # Send step complete with findings
                yield f"data: {json.dumps({'type': 'step_complete', 'step': step_num, 'step_name': step_name, 'findings': latest_entry['findings'] if latest_entry else [], 'timestamp': datetime.now().isoformat()})}\n\n"
                
                # Small delay for UI rendering
                await asyncio.sleep(0.1)
            
            # Persist investigation results before sending final event
            try:
                await agent._persist_investigation(state, started_at, datetime.now(timezone.utc))
            except Exception as persist_err:
                state["errors"].append(f"persist: {persist_err}")

            # Send final result
            result = {
                "type": "complete",
                "alert_id": alert_id,
                "investigation_id": investigation_id,
                "recommendation": state["recommendation"],
                "confidence": state["confidence"],
                "risk_score": state["risk_score"],
                "journal": state["journal_entries"],
                "narrative": state["narrative"],
                "timestamp": datetime.now().isoformat()
            }

            yield f"data: {json.dumps(result)}\n\n"

        except Exception as e:
            error_data = {
                "type": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(
        generate_progress(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.get("/api/skills")
async def list_skills():
    """List all available investigation skills"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    return {
        "skills": agent.skills,
        "count": len(agent.skills)
    }


@app.get("/api/skills/{skill_name}")
async def get_skill(skill_name: str):
    """Get details for a specific skill"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    skill = next((s for s in agent.skills if s['name'] == skill_name), None)
    
    if not skill:
        raise HTTPException(status_code=404, detail=f"Skill '{skill_name}' not found")
    
    # Load full skill content
    content = agent.skills_loader.get_skill_content(skill_name)
    
    return {
        **skill,
        "content": content
    }


# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*70)
    print("  THEMIS AGENT API SERVER")
    print("="*70)
    print("\n🚀 Starting server on http://localhost:8000")
    print("📚 API docs available at http://localhost:8000/docs")
    print("🔍 Investigation endpoint: POST /api/investigate")
    print("📡 Streaming endpoint: GET /api/investigate/{alert_id}/stream")
    print("\n" + "="*70 + "\n")
    
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
