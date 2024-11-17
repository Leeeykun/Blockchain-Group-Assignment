import subprocess
import os
import solcx
from solcx import compile_standard;
 
class SolidityAnalyzer:
# Define the class SolidityAnalyzer
    def __init__(self, contract_file):
        self.contract_file = contract_file
        self.solidity_version = "0.8.20"  # Adjust the version as needed
 
# Compile the contract and return the compiled result
    def compile_contract(self):
        with open(self.contract_file, "r", encoding="utf-8") as f:
            contract_code = f.read()    # Read the contract file
 
        compiled_sol = compile_standard({
            "language": "Solidity",
            "sources": {
                os.path.basename(self.contract_file): { 
                    "content": contract_code 
                } # # Define the content of the contract file, here use os.path.basename (self.contract_file) to get the file name
            }, # and use the read contract code as the content.
            "settings": {
                "outputSelection": {
                    "*": {
                        "*": ["abi", "evm.bytecode"]
                    }
                }
            }
        }, solc_version=self.solidity_version,allow_paths=".")
 
        return compiled_sol
 
# Using Slither to analyze the contract and return the analysis result
    def analyze_with_slither(self):
        try:
            result = subprocess.run(
                ["slither", self.contract_file],
                capture_output=True, text=True, check=True  # Capture the output and check for errors
            )
            return result.stdout
        except subprocess.CalledProcessError as e:
            print(f"Error running slither: {e}") # Print the error message if there is an error
            return e.stderr
 
 # Find common vulnerabilities in the contract and return a list of vulnerabilities
    def find_common_vulnerabilities(self):      
        vulnerabilities = []

         # Check for potential reentrancy attack
        with open(self.contract_file, "r", encoding="utf-8") as file:
            code = file.read()
            if "call.value" in code or "delegatecall" in code: 
                vulnerabilities.append("Potential Reentrancy Attack detected!")
         
        # Check for uninitialized state variables
        if "public uint" in code and "constructor" not in code:
            vulnerabilities.append("Uninitialized state variables detected!")
 
        return vulnerabilities
 
 # Run the analysis and return the compiled result, the Slither report, and a list of common vulnerabilities
    def run_analysis(self):      
        print("Compiling contract...")
        compiled = self.compile_contract()
 
        print("Running Slither analysis...")
        slither_report = self.analyze_with_slither()
 
        print("Searching for common vulnerabilities...")
        common_vulnerabilities = self.find_common_vulnerabilities()
 
        print("\nSlither Report:")
        print(slither_report)
 
        print("\nCommon Vulnerabilities Detected:")
        for vuln in common_vulnerabilities:
            print(f"- {vuln}")
 
        return compiled, slither_report, common_vulnerabilities
 
if __name__ == "__main__":
     
    solcx.install_solc('0.8.20')
    contract_file = "D:/VS Code/Coding/Blockchain/ry.sol"  # Adjust the file path as needed
    analyzer = SolidityAnalyzer(contract_file)
    analyzer.run_analysis()