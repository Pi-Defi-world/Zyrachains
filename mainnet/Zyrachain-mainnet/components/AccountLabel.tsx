import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import CopyIcon from "@/components/copyIcon";
import { useAddressContext } from "@/context/AddressContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AddressData {
  name: string;
  logo?: string;
  category: string;
  description?: string;
  website?: string;
  role?: string;
  identifier: string;
}

const AccountLabel = ({ 
  account, 
  shorten, 
  noLink = false, 
  addressData = [] 
}: { 
  account: string; 
  shorten: boolean; 
  noLink?: boolean;
  addressData?: AddressData[];
}) => {
  const [addressInfo, setAddressInfo] = useState<AddressData | null>(null);
  const [loading, setLoading] = useState(true);
  const { isInitialized, isLoading, addresses } = useAddressContext();

  useEffect(() => {
    const findAddressInfo = async () => {
      try {
        setLoading(true);
        
        // Wait for addresses to be initialized
        if (!isInitialized || isLoading) {
          return;
        }

        // First, check local address database for known addresses
        const localFound = addresses[account];
        
        if (localFound) {
          // Use local database data for known addresses
          setAddressInfo({
            name: localFound.Name,
            logo: localFound.Logo,
            category: localFound.Category,
            description: localFound.Description,
            website: localFound.Website,
            role: localFound.Role,
            identifier: account
          });
        } else {
          // Not labeled: don't hit Horizon just to label UI.
          setAddressInfo(null);
        }
      } catch (error) {
        console.error('Error looking up address:', error);
        setAddressInfo(null);
      } finally {
        setLoading(false);
      }
    };

    findAddressInfo();
  }, [account, isInitialized, isLoading, addresses]);

  const content = (
    <>
      {!loading && addressInfo ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1">
              {addressInfo.logo && (
                    <Image
                  src={addressInfo.logo}
                  alt={addressInfo.name}
                      width={16}
                      height={16}
                      className="rounded-sm"
                    />
                  )}
              {addressInfo.name}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{account}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="font-mono text-sm">
              {shorten 
                ? `${account.substr(0, 6)}...${account.substr(-6)}`
                : account
              }
            </span>
          )}
    </>
  );

  return (
    <TooltipProvider>
      <span className="inline-flex items-center gap-2">
        {noLink ? (
          <span className="text-emerald-600 hover:text-emerald-800 transition-colors">
            {content}
          </span>
        ) : (
          <Link 
            href={`/account/${account}`} 
            className="text-emerald-600 hover:text-emerald-800 transition-colors no-underline"
          >
            {content}
        </Link>
        )}
        <CopyIcon textToCopy={account} />
      </span>
    </TooltipProvider>
  );
};

export default AccountLabel;
