"use client";
import React, { useEffect, useState } from "react";
import { LabledAddress, getCexAddresses } from "@/utils/addresses";
import AccountLabel from "./AccountLabel";
import { horizon } from "@/api/horizon";
import Image from "next/image";
import { describePredicate } from "@/utils/predicate";
import { useLanguage } from "@/context/languagecontext";
import { Badge } from "@/components/ui/badge";

const OperationText = ({ op, PiPrice }: { op: any, PiPrice: number }) => {
  const { t, language } = useLanguage();
  
  // Define operation type translations using translation keys
  const operations: { [key: string]: string } = {
    claim_claimable_balance: String(t('operations.claim_claimable_balance')),
    create_account: String(t('operations.create_account')),
    payment: String(t('operations.payment')),
    path_payment_strict_receive: String(t('operations.path_payment_strict_receive')),
    path_payment_strict_send: String(t('operations.path_payment_strict_send')),
    manage_sell_offer: String(t('operations.manage_sell_offer')),
    create_passive_sell_offer: String(t('operations.create_passive_sell_offer')),
    set_options: String(t('operations.set_options')),
    change_trust: String(t('operations.change_trust')),
    allow_trust: String(t('operations.allow_trust')),
    account_merge: String(t('operations.account_merge')),
    inflation: String(t('operations.inflation')),
    manage_data: String(t('operations.manage_data')),
    bump_sequence: String(t('operations.bump_sequence')),
    manage_buy_offer: String(t('operations.manage_buy_offer')),
    create_passive_buy_offer: String(t('operations.create_passive_buy_offer')),
    create_claimable_balance: String(t('operations.create_claimable_balance')),
    claim_claimable_balance_atom: String(t('operations.claim_claimable_balance_atom')),
  };
  
  const [claimAmount, setClaimAmount] = useState(0);
  
  // Format amount based on user's locale
  const formatAmount = (amount: number): string => {
    return amount > 0.01 
      ? amount.toLocaleString(language, { 
          minimumFractionDigits: 0, 
          maximumFractionDigits: 2 
        }) 
      : amount.toLocaleString(language, { 
          minimumFractionDigits: 0, 
          maximumFractionDigits: 6 
        });
  };

  // Format currency based on user's locale
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString(language, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };
  
  useEffect(() => {
    if(op.type === "claim_claimable_balance") {
      horizon.getClaimEffect(op._links.effects.href).then((amount) => {
        setClaimAmount(amount);
      });
    }
  }, [op]);

  if (operations[op.type]) {
    if (op.type === "payment") {
      const amount = parseFloat(op.amount);
      const amountUsd = amount * PiPrice;
      
      // Check if receiver is a CEX
      const cexAddresses = getCexAddresses();
      if (cexAddresses.includes(op.to)) {
        const cexData = LabledAddress[op.to];
        if (cexData) {
          return (
            <span key={op.id}>
              <AccountLabel account={op.source_account} shorten={true}/> {t('operations.deposit')}{" "}
              <b className="pi-amount-text-success">
                {formatAmount(amount)} π
              </b>{" "}
              <span className="text-muted">
                ({formatCurrency(amountUsd)})
              </span>{" "}
              {t('operations.to')}{" "}
              <a
                href={cexData.Website}
                target="_blank"
                rel="noreferrer"
                className="text-decoration-none"
              >
                <img
                  src={cexData.Logo}
                  alt={cexData.Name}
                  className="cex-logo"
                  width={16}
                />{" "}
                <span className="cex-name">{cexData.Name}</span>
              </a>
            </span>
          );
        }
      }
      
      // Check if sender is a CEX
      if (cexAddresses.includes(op.from)) {
        const cexData = LabledAddress[op.from];
        if (cexData) {
          return (
            <span key={op.id}>
              <AccountLabel account={op.to} shorten={true}/> {t('operations.withdraw')}{" "}
              <b className="text-danger">
                {formatAmount(amount)} π
              </b>{" "}
              <span className="text-muted">
                ({formatCurrency(amountUsd)})
              </span>{" "}
              {t('operations.from')}{" "}
              <a
                href={cexData.Website}
                target="_blank"
                rel="noreferrer"
                className="text-decoration-none"
              >
                <img
                  src={cexData.Logo}
                  alt={cexData.Name}
                  className="cex-logo"
                  width={16}
                />{" "}
                <span className="cex-name">{cexData.Name}</span>
              </a>
            </span>
          );
        }
      }
      
      // Regular payment
      return (
        <span key={op.id}>
          
          <AccountLabel account={op.source_account} shorten={true}/>{" "}
          {t('operations.pay')}{" "}
          <b className="pi-amount-text-success">
            {formatAmount(amount)} π
          </b>{" "}
          <span className="text-muted">
            ({formatCurrency(amountUsd)})
          </span>{" "}
          {t('operations.to')}{" "}
          <AccountLabel account={op.to} shorten={true}/>{" "}
          {/* Add self-transfer warning badge */}
          {op.source_account === op.to && (
            <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300">
             {t('operations.self_transfer')}
            </Badge>
          )}
          
        </span>
      );
    } else if (op.type === "create_claimable_balance") {
      // Domain auction registration special account
      const DOMAIN_AUCTION_ACCOUNT = "GBIDYJNTVLYWNMA4WCW2DONEDBTVZ7H6EJT6HEOXTWRZ5KMGDGKBVRIL";
      const isDomainAuction = op.claimants && op.claimants.some(
        (claimant: any) => claimant.destination === DOMAIN_AUCTION_ACCOUNT
      );

      return (
        <span key={op.id}>
          <AccountLabel account={op.source_account} shorten={true}/>{" "}
          {t('operations.create_claimable_balance')}{" "}
          <b className="pi-amount-text-success">
            {formatAmount(parseFloat(op.amount))} π
          </b>{" "}
          <span className="text-muted">
            ({formatCurrency(parseFloat(op.amount) * PiPrice)})
          </span>{" "}
          
          {/* Add domain auction badge if applicable */}
          {isDomainAuction && (
            <Badge className="ml-2 bg-emerald-100 text-emerald-800">
               <i className="bi bi-globe mr-1"></i> {t('operations.domain_auction')}
            </Badge>
          )}
          
          {op.claimants && op.claimants.length > 0 && (
            <div className="mt-2">
              <span className="fw-medium">{t('operations.claimant')}:</span>
              <ul className="list-unstyled mb-0 ps-3 mt-1">
                {op.claimants.map((claimant: any) => (
                  <li key={claimant.destination} className="mb-1 d-flex align-items-start">
                    <i className="bi bi-person-fill text-secondary me-2 mt-1 text-sm"></i>
                    <div>
                      <AccountLabel account={claimant.destination} shorten={true} />
                      <Badge variant="outline" className="ml-2 bg-muted text-muted-foreground border-border">
                        {describePredicate(claimant.predicate, language)}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </span>
      );
    } else if (op.type === "create_account") {
      return (
        <span key={op.id}>
          <AccountLabel account={op.source_account} shorten={true}/>{" "}
          {t('operations.create_account')}{" "}
          <AccountLabel account={op.account} shorten={true}/>
          {" "}{t('operations.with_starting_balance')}{" "}
          <b className="pi-amount-text-success">
            {formatAmount(parseFloat(op.starting_balance))} π
          </b>{" "}
          <span className="text-muted">
            ({formatCurrency(parseFloat(op.starting_balance) * PiPrice)})
          </span>
        </span>
      );
    } else if (op.type === "claim_claimable_balance") {
      return (
        <span key={op.id}>
          <AccountLabel account={op.source_account} shorten={true}/>{" "}
          {t('operations.claim')}{" "}
          <b className="pi-amount-text-success">
            {formatAmount(claimAmount)} π
          </b>{" "}
          <span className="text-muted">
            ({formatCurrency(claimAmount * PiPrice)})
          </span>
        </span>
      );
    }
    
    // Return the basic operation name for other types
    return <span>{operations[op.type]}</span>;
  }
  
  // If operation type is not recognized, return the raw type
  return <span>{op.type}</span>;
};

export default OperationText;
