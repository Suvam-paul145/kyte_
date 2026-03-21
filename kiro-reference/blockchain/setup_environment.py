#!/usr/bin/env python3
"""
Environment setup script for CodePact PyTeal development.
Validates that all required dependencies are installed and working.
"""

import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Check that Python version is 3.8 or higher."""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print(f"❌ Python 3.8+ required, found {version.major}.{version.minor}")
        return False
    
    print(f"✅ Python {version.major}.{version.minor}.{version.micro}")
    return True

def check_dependencies():
    """Check that all required dependencies are installed."""
    dependencies = [
        ("pyteal", "PyTeal smart contract framework"),
        ("algosdk", "Algorand Python SDK"),
        ("pytest", "Testing framework"),
        ("dotenv", "Environment variable management")
    ]
    
    all_good = True
    
    for module, description in dependencies:
        try:
            __import__(module)
            print(f"✅ {description}")
        except ImportError:
            print(f"❌ {description} - run: pip install {module}")
            all_good = False
    
    return all_good

def install_dependencies():
    """Install dependencies from requirements.txt."""
    requirements_file = Path(__file__).parent.parent / "requirements.txt"
    
    if not requirements_file.exists():
        print(f"❌ Requirements file not found: {requirements_file}")
        return False
    
    try:
        print("📦 Installing dependencies...")
        result = subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Dependencies installed successfully")
            return True
        else:
            print(f"❌ Installation failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Installation error: {e}")
        return False

def test_contract_compilation():
    """Test that the smart contract can be compiled."""
    try:
        # Add contracts directory to path
        contracts_dir = Path(__file__).parent / "contracts"
        sys.path.insert(0, str(contracts_dir))
        
        from codepact import approval_program
        from clear_state import clear_state_program
        from pyteal import compileTeal, Mode
        
        # Test compilation
        approval = approval_program()
        clear_state = clear_state_program()
        
        approval_teal = compileTeal(approval, Mode.Application, version=8)
        clear_teal = compileTeal(clear_state, Mode.Application, version=8)
        
        print("✅ Smart contract compiles successfully")
        print(f"   📏 Approval program: {len(approval_teal.splitlines())} lines of TEAL")
        print(f"   📏 Clear state program: {len(clear_teal.splitlines())} lines of TEAL")
        
        return True
        
    except Exception as e:
        print(f"❌ Contract compilation failed: {e}")
        return False

def main():
    """Main setup and validation routine."""
    print("🚀 CodePact PyTeal Environment Setup")
    print("=" * 40)
    
    # Check Python version
    if not check_python_version():
        return False
    
    print("\n📋 Checking Dependencies:")
    if not check_dependencies():
        print("\n📦 Installing missing dependencies...")
        if not install_dependencies():
            return False
        
        # Re-check after installation
        print("\n📋 Re-checking Dependencies:")
        if not check_dependencies():
            return False
    
    print("\n🔧 Testing Smart Contract Compilation:")
    if not test_contract_compilation():
        return False
    
    print("\n🎉 Environment setup complete!")
    print("\nNext steps:")
    print("1. Run: python blockchain/compile.py")
    print("2. Run: python blockchain/test_contract_structure.py")
    print("3. Continue with Task 1.2 (property tests)")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)