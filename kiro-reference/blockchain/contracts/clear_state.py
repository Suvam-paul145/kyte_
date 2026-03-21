"""
CodePact Clear State Program

This is the clear state program for the CodePact smart contract.
It handles the cleanup when a user opts out of the application.

For CodePact, we use a minimal clear state program that always approves,
allowing users to clear their local state at any time without restrictions.
This is appropriate since CodePact doesn't use local state for critical
contract logic - all important state is stored globally.
"""

from pyteal import *

def clear_state_program():
    """
    Clear state program for CodePact smart contract.
    
    This program is executed when a user clears their local state
    (opts out of the application). Since CodePact doesn't store
    critical data in local state, we always approve clear operations.
    
    Returns:
        PyTeal expression that always approves clear state operations
    """
    return Approve()

if __name__ == "__main__":
    # Compile clear state program to TEAL
    clear_state_teal = compileTeal(clear_state_program(), Mode.Application, version=8)
    
    # Write TEAL file
    with open("clear_state.teal", "w") as f:
        f.write(clear_state_teal)
    
    print("Clear state program compiled successfully!")
    print("File generated: clear_state.teal")