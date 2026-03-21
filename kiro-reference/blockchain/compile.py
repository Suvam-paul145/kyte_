#!/usr/bin/env python3
"""
Compilation script for CodePact smart contract.
Compiles PyTeal code to TEAL and generates bytecode for deployment.
"""

import os
import sys
from pathlib import Path

# Add the contracts directory to Python path
sys.path.append(str(Path(__file__).parent / "contracts"))

from pyteal import *
from codepact import approval_program
from clear_state import clear_state_program

def compile_contracts():
    """Compile PyTeal programs to TEAL and bytecode."""
    
    # Create output directory
    output_dir = Path(__file__).parent / "build"
    output_dir.mkdir(exist_ok=True)
    
    try:
        # Compile approval program
        print("Compiling approval program...")
        approval_teal = compileTeal(approval_program(), Mode.Application, version=8)
        
        # Compile clear state program  
        print("Compiling clear state program...")
        clear_state_teal = compileTeal(clear_state_program(), Mode.Application, version=8)
        
        # Write TEAL files
        approval_path = output_dir / "approval.teal"
        clear_state_path = output_dir / "clear_state.teal"
        
        with open(approval_path, "w") as f:
            f.write(approval_teal)
        
        with open(clear_state_path, "w") as f:
            f.write(clear_state_teal)
        
        print(f"✅ Compilation successful!")
        print(f"📁 Output directory: {output_dir}")
        print(f"📄 Approval program: {approval_path}")
        print(f"📄 Clear state program: {clear_state_path}")
        
        # Display contract info
        print("\n📊 Contract Information:")
        print(f"   - Global state schema: 4 uints, 4 byte slices")
        print(f"   - Local state schema: 0 uints, 0 byte slices")
        print(f"   - Supported operations: create_project, submit_work, post_score, release_payment")
        print(f"   - Automatic payment threshold: 80/100 score")
        
        return True
        
    except Exception as e:
        print(f"❌ Compilation failed: {e}")
        return False

if __name__ == "__main__":
    success = compile_contracts()
    sys.exit(0 if success else 1)