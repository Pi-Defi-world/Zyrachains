
  // Format number according to user locale
  export const formatNumber = (value: number,language:string): string => {
    return value.toLocaleString(language, {  
      minimumFractionDigits: 0,  
      maximumFractionDigits: 2 
    });
  };

  // Format currency according to user locale
  export  const formatCurrency = (value: number,language:string): string => {
    return value.toLocaleString(language, {  
      minimumFractionDigits: 0,  
      maximumFractionDigits: 2 
    });
  };