let lastGoodPrice: number | null = null;

export const fetchPiPrice = async (): Promise<number | null> => {
    try {
      const response = await fetch('https://api.zyrachain.org/data/pi-price');
      if (response.ok) {
        const data = await response.json();
        if (data && data.data && data.data[0]) {
           const price = parseFloat(data.data[0].idxPx);
           if (price > 0) lastGoodPrice = price;
           return price;
        }
      }
    } catch (error) {
      console.error("Failed to fetch Pi price:", error);
    }
    return lastGoodPrice;
  };