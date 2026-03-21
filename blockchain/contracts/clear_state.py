import os
from pyteal import *

def clear_state_program():
    return Return(Int(1))

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(current_dir, "clear.teal")
    with open(output_path, "w") as f:
        compiled = compileTeal(clear_state_program(), Mode.Application, version=8)
        f.write(compiled)
    print(f"Compiled to {output_path}")
