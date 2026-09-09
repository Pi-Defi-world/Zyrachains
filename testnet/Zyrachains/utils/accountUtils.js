import { coreTeamAddress } from "./addresses";

// Function to check if an account belongs to Pi Core Team
export const isPiCoreTeamAccount = (accountId) => {
  // Check if the account is in the core team address list
  return coreTeamAddress.some(address => address === accountId);
  
  // Alternative: You could also check if the account has a specific label or prefix
  // return accountId.startsWith('GCORE') || knownPiTeamAccounts.includes(accountId);
};