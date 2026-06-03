"use client";
import React, { useState, useEffect, useCallback } from "react";
import { usePageMetadata } from "@/context/pagemetadataContext";
import { useLanguage } from "@/context/languagecontext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import AccountLabel from "@/components/AccountLabel";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { PiscanAPI } from "@/api/piscan"; // Assuming PiscanAPI is defined here
import { timelib } from "@/utils/time"; // Import timelib

// Interfaces for API response
interface OperationDetails {
  to: string;
  from: string;
  amount: string;
  asset_type: string;
}

interface Operation {
  details: OperationDetails;
  source_account: string;
  transaction_hash: string;
  transaction_time: string;
}

interface TransactionsApiResponse {
  operations: Operation[];
  pagination: {
    page: number;
    limit: number;
    has_next: boolean;
  };
}

interface Filters {
  address: string;
  minAmount: string;
  maxAmount: string;
}

const PAGE_LIMIT = 20;

const TransactionsFilter: React.FC = () => {
  const { t, language } = useLanguage();
  const { setHeading, setTitle, setDescription } = usePageMetadata();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [transactions, setTransactions] = useState<Operation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    address: "",
    minAmount: "10000", // Default minAmount
    maxAmount: "",
  });
  const [amountError, setAmountError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);

  useEffect(() => {
    setHeading(String(t("transactions_filter.heading", { defaultValue: "Filter Transactions" })));
    setTitle(String(t("transactions_filter.title", { defaultValue: "Filter Transactions | Pi Scan" })));
    setDescription(
      String(
        t(
          "transactions_filter.description",
          { defaultValue: "Filter and search for Pi Network transactions based on address, amount, and other criteria." }
        )
      )
    );
  }, [setHeading, setTitle, setDescription, t, language]);

  useEffect(() => {
    const addressFromUrl = searchParams.get("address");
    const minAmountFromUrl = searchParams.get("minAmount");
    const maxAmountFromUrl = searchParams.get("maxAmount");

    const initialFiltersState: Filters = {
      address: addressFromUrl || "",
      minAmount: minAmountFromUrl || "10000",
      maxAmount: maxAmountFromUrl || "",
    };
    setFilters(initialFiltersState);

    if (addressFromUrl && addressFromUrl.trim() !== "") {
      let isValidForAutoApply = true;
      let tempAmountError: string | null = null;

      if (initialFiltersState.minAmount && parseFloat(initialFiltersState.minAmount) < 10000) {
        tempAmountError = String(t("transactions_filter.amount_too_low_error", { defaultValue: "Minimum amount cannot be less than 10,000" }));
        isValidForAutoApply = false;
      }
      if (initialFiltersState.maxAmount && parseFloat(initialFiltersState.maxAmount) < 10000) {
        tempAmountError = tempAmountError || String(t("transactions_filter.amount_too_low_error_max", { defaultValue: "Maximum amount cannot be less than 10,000" }));
        isValidForAutoApply = false;
      }
      if (initialFiltersState.minAmount && initialFiltersState.maxAmount &&
          parseFloat(initialFiltersState.minAmount) > parseFloat(initialFiltersState.maxAmount)) {
        tempAmountError = tempAmountError || String(t("transactions_filter.min_exceeds_max_error", { defaultValue: "Minimum amount cannot exceed maximum amount" }));
        isValidForAutoApply = false;
      }

      setAmountError(tempAmountError);

      if (isValidForAutoApply) {
        setAppliedFilters(initialFiltersState);
        setCurrentPage(1);
      } else {
        setAppliedFilters(null);
      }
    } else if (addressFromUrl && addressFromUrl.trim() === "") {
      setAddressError(String(t("transactions_filter.address_required_error", { defaultValue: "Address is required." })));
      setAppliedFilters(null);
    } else if (!addressFromUrl && !minAmountFromUrl && !maxAmountFromUrl) {
      setAppliedFilters(null);
    }
  }, [searchParams, t]);

  const fetchTransactions = useCallback(
    async (page: number, currentFilters: Filters) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (currentFilters.address) params.append("address", currentFilters.address);
        if (currentFilters.minAmount) params.append("min_amount", currentFilters.minAmount);
        if (currentFilters.maxAmount) params.append("max_amount", currentFilters.maxAmount);
        params.append("limit", String(PAGE_LIMIT));
        params.append("page", String(page));

        const response = await fetch(`${PiscanAPI.Transactions}?${params.toString()}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Network response was not ok" }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const data: TransactionsApiResponse = await response.json();
        setTransactions(data.operations || []);
        setCurrentPage(data.pagination.page);
        setHasNextPage(data.pagination.has_next);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError(err instanceof Error ? err.message : String(err));
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (appliedFilters) {
      fetchTransactions(currentPage, appliedFilters);
    }
  }, [currentPage, appliedFilters, fetchTransactions]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === "address") {
      setAddressError(null);
    }

    if (name === "minAmount" || name === "maxAmount") {
      setAmountError(null);
      if (value && parseFloat(value) < 0) {
        processedValue = "0";
      }
    }

    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: processedValue,
    }));
  };

  const handleApplyFilters = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();

    let currentAddressError: string | null = null;
    let currentAmountError: string | null = null;
    let isValid = true;

    if (!filters.address.trim()) {
      currentAddressError = String(t("transactions_filter.address_required_error", { defaultValue: "Address is required." }));
      isValid = false;
    }

    if (!filters.minAmount.trim()) {
      currentAmountError = String(t("transactions_filter.min_amount_required_error", { defaultValue: "Minimum amount is required." }));
      isValid = false;
    } else if (parseFloat(filters.minAmount) < 10000) {
      currentAmountError = String(t("transactions_filter.amount_too_low_error", { defaultValue: "Minimum amount cannot be less than 10,000" }));
      isValid = false;
    }

    if (filters.maxAmount.trim() !== "") {
      if (parseFloat(filters.maxAmount) < 10000) {
        currentAmountError = currentAmountError || String(t("transactions_filter.amount_too_low_error_max", { defaultValue: "Maximum amount cannot be less than 10,000" }));
        isValid = false;
      }
      if (filters.minAmount.trim() && !currentAmountError && parseFloat(filters.minAmount) > parseFloat(filters.maxAmount)) {
        currentAmountError = currentAmountError || String(t("transactions_filter.min_exceeds_max_error", { defaultValue: "Minimum amount cannot exceed maximum amount" }));
        isValid = false;
      }
    }
    
    setAddressError(currentAddressError);
    setAmountError(currentAmountError);

    if (!isValid) {
      return;
    }

    setCurrentPage(1);
    setAppliedFilters(filters);

    const newParams = new URLSearchParams();
    if (filters.address) newParams.append("address", filters.address);
    if (filters.minAmount) newParams.append("minAmount", filters.minAmount);
    if (filters.maxAmount) newParams.append("maxAmount", filters.maxAmount);
    
    if (Array.from(newParams.values()).some(val => val && val.trim() !== "")) {
      router.replace(`${pathname}?${newParams.toString()}`);
    } else {
      router.replace(pathname);
    }
  };

  const handleClearFilters = () => {
    const defaultFiltersState = { address: "", minAmount: "10000", maxAmount: "" };
    setFilters(defaultFiltersState);
    setAppliedFilters(null);
    setTransactions([]);
    setCurrentPage(1);
    setHasNextPage(false);
    setError(null);
    setAmountError(null);
    setAddressError(null);
    router.replace(pathname);
  };

  const formatAmount = (amountStr: string): string => {
    const amount = parseFloat(amountStr);
    return amount.toLocaleString(language, {
      minimumFractionDigits: 0, // Keep minimum as 0 or 2, depending on preference
      maximumFractionDigits: 2, // Change to 2
    });
  };

  return (
    <div className="transactions-filter-page px-4 sm:px-6 lg:px-8">
      <Card className="mb-4 overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <h5 className="text-lg font-medium mb-4">{String(t("transactions_filter.filter_options", { defaultValue: "Filter Options" }))}</h5>
          <form onSubmit={handleApplyFilters}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
              <div className="md:col-span-4">
                <div className="mb-3">
                  <label htmlFor="filterAddress" className="block text-sm font-medium mb-1">
                    {String(t("transactions_filter.address", { defaultValue: "Address" }))}
                  </label>
                  <Input
                    type="text"
                    id="filterAddress"
                    name="address"
                    value={filters.address}
                    onChange={handleFilterChange}
                    placeholder={String(t("transactions_filter.address_placeholder", { defaultValue: "Enter account address" }))}
                    className={addressError ? "border-red-500" : ""}
                  />
                  {addressError && (
                    <div className="text-red-500 text-sm mt-1">
                      {addressError}
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-3">
                <div className="mb-3">
                  <label htmlFor="filterMinAmount" className="block text-sm font-medium mb-1">
                    {t("transactions_filter.min_amount", { defaultValue: "Min Amount (Pi)" })}
                  </label>
                  <Input
                    type="number"
                    id="filterMinAmount"
                    name="minAmount"
                    value={filters.minAmount}
                    onChange={handleFilterChange}
                    placeholder={String(t("transactions_filter.min_amount_placeholder", { defaultValue: "e.g., 10000" }))}
                    step="any"
                    min="0"
                    className={
                      (!!amountError && (amountError.includes("10,000") || amountError.includes("required") || amountError.includes("exceed"))) ||
                      (amountError !== null &&
                        ((filters.minAmount !== "" && parseFloat(filters.minAmount) < 10000) ||
                          (filters.minAmount !== "" && filters.maxAmount !== "" && parseFloat(filters.minAmount) > parseFloat(filters.maxAmount)))
                      ) ? "border-red-500" : ""
                    }
                  />
                  {amountError && (
                    <div className="text-red-500 text-sm mt-1">
                      {amountError}
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-3">
                <div className="mb-3">
                  <label htmlFor="filterMaxAmount" className="block text-sm font-medium mb-1">
                    {t("transactions_filter.max_amount", { defaultValue: "Max Amount (Pi)" })}
                  </label>
                  <Input
                    type="number"
                    id="filterMaxAmount"
                    name="maxAmount"
                    value={filters.maxAmount}
                    onChange={handleFilterChange}
                    placeholder={String(t("transactions_filter.max_amount_placeholder", { defaultValue: "e.g., 100000" }))}
                    step="any"
                    min="0"
                    className={
                      (!!amountError && (amountError.includes("10,000") || amountError.includes("exceed"))) || 
                      (amountError !== null &&
                        ((filters.maxAmount !== "" && parseFloat(filters.maxAmount) < 10000) ||
                          (filters.minAmount !== "" && filters.maxAmount !== "" && parseFloat(filters.minAmount) > parseFloat(filters.maxAmount)))
                      ) ? "border-red-500" : ""
                    }
                  />
                  {amountError && (
                    <div className="text-red-500 text-sm mt-1">
                      {amountError}
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 flex flex-wrap items-end mb-3 gap-2 min-w-0">
                <Button variant="default" type="submit" className="flex-1 min-w-[70px] whitespace-nowrap">
                  {t("transactions_filter.apply_filters", { defaultValue: "Apply" })}
                </Button>
                <Button variant="outline" type="button" onClick={handleClearFilters} className="flex-1 min-w-[70px] whitespace-nowrap">
                  {t("transactions_filter.clear", { defaultValue: "Clear" })}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex justify-center my-8">
          <Spinner />
          <span className="sr-only">{t("common.loading", { defaultValue: "Loading..." })}</span>
        </div>
      )}

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {!loading && !error && appliedFilters && transactions.length === 0 && (
        <div className="bg-emerald-100 border border-emerald-400 text-emerald-700 px-4 py-3 rounded mb-4">{t("transactions_filter.no_results", { defaultValue: "No transactions found matching your criteria." })}</div>
      )}
      
      {!loading && !error && transactions.length > 0 && (
        <Card>
          <CardContent>
            <h5 className="text-lg font-medium mb-4">{t("transactions_filter.results", { defaultValue: "Results" })}</h5>
            <div className="overflow-x-auto">
              <Table className="mt-3 mb-0">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("transactions_filter.table.time", { defaultValue: "Time" })}</TableHead>
                    <TableHead>{t("transactions_filter.table.from", { defaultValue: "From" })}</TableHead>
                    <TableHead>{t("transactions_filter.table.to", { defaultValue: "To" })}</TableHead>
                    <TableHead className="text-right">{t("transactions_filter.table.amount", { defaultValue: "Amount (Pi)" })}</TableHead>
                    <TableHead>{t("transactions_filter.table.hash", { defaultValue: "Tx Hash" })}</TableHead> 
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((op) => (
                    <TableRow key={op.transaction_hash + op.details.amount + op.details.to}>
                      <TableCell>{timelib.timeAgo(op.transaction_time, language)}</TableCell>
                      <TableCell>
                        <AccountLabel account={op.details.from} shorten={true} />
                      </TableCell>
                      <TableCell>
                        <AccountLabel account={op.details.to} shorten={true} />
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatAmount(op.details.amount)}
                      </TableCell>
                      <TableCell>
                        <Link href={`/tx/${op.transaction_hash}`} className="no-underline">
                          {op.transaction_hash.substring(0, 10)}...
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-center mt-4 gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                {t("pagination.previous", { defaultValue: "Previous" })}
              </Button>
              <span className="self-center">
                {t("pagination.page", { defaultValue: "Page" })} {currentPage}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={!hasNextPage}
              >
                {t("pagination.next", { defaultValue: "Next" })}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {!loading && !error && !appliedFilters && (
        <div className="bg-gray-100 border border-gray-400 text-gray-700 px-4 py-3 rounded">{t("transactions_filter.apply_filters_prompt", { defaultValue: "Please apply filters to see results." })}</div>
      )}
    </div>
  );
};

export default TransactionsFilter;
