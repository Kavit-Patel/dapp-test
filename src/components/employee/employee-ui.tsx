"use client";

import PerfectScrollbar from "react-perfect-scrollbar";
import "react-perfect-scrollbar/dist/css/styles.css";
import { PublicKey } from "@solana/web3.js";
import { useEmployee } from "./employee-data-access";
import { IoMdRefresh } from "react-icons/io";
import { useEffect, useState } from "react";
import Loader from "@/common/common-loader";
import { IClaimTokens } from "./types";

export function EmployeeUi({ publicKey }: { publicKey: PublicKey }) {
  const {
    employeeAccounts: employeeAccountsQuery,
    calculateClaimableTokens,
    claimTokens,
  } = useEmployee(publicKey);

  if (employeeAccountsQuery.isLoading) {
    return (
      <div className="w-screen h-96 flex justify-center items-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }
  if (
    !employeeAccountsQuery.isLoading &&
    (!employeeAccountsQuery.data || employeeAccountsQuery.data.length === 0)
  ) {
    return (
      <div className=" flex flex-col justify-center mt-24">
        <span className="w-full text-center">
          Your haven&apos;t added to any token vesting program.
        </span>
      </div>
    );
  }
  return (
    <div className={"space-y-6"}>
      {employeeAccountsQuery.isLoading ? (
        <div className="w-screen h-96 flex justify-center items-center">
          <span className="loading loading-spinner loading-lg flex justify-center items-center h-96"></span>
        </div>
      ) : employeeAccountsQuery.error ? (
        <span className="text-xl">
          Error occured whicle fetching your token vesting accounts.
        </span>
      ) : employeeAccountsQuery.data ? (
        <div className="max-w-[100vw-200px]">
          <EmployeeProgramCard
            employeeAccounts={employeeAccountsQuery.data}
            claimableTokens={calculateClaimableTokens}
            claimTokens={claimTokens.mutateAsync}
          />
        </div>
      ) : (
        <div className="text-center">
          <h2 className={"text-2xl"}>No accounts</h2>
          No accounts found.
        </div>
      )}
    </div>
  );
}

interface IEmployeeVesting {
  pda: string;
  beneficiary: string;
  token: string;
  startTime: number;
  endTime: number;
  cliffTime: number;
  totalAmount: number;
  totalWithdrawn: number;
  treasuryTokenAccount: string;
  vestingAccount: string;
  companyName: string;
}

function EmployeeProgramCard({
  employeeAccounts,
  claimableTokens,
  claimTokens,
}: {
  employeeAccounts: IEmployeeVesting[];
  claimableTokens: (
    startTime: number,
    endTime: number,
    cliffTime: number,
    totalAmount: number,
    totalWithdrawn: number,
    currentTime: number
  ) => number;
  claimTokens: ({
    companyName,
    vestingAccountPubkey,
    employeeAccountPubkey,
    mintPubkey,
    treasuryTokenAccountPubkey,
  }: IClaimTokens) => Promise<{ signature: string }>;
}) {
  const [claimableTokenMap, setClaimableTokenMap] = useState<{
    [key: string]: string;
  }>({});
  const [claimTokenLoading, setClaimTokenLoading] = useState<{
    [key: string]: boolean;
  }>({});
  console.log("clai ", claimTokenLoading);
  useEffect(() => {
    const initialClaimableTokens: { [key: string]: string } = {};
    const initialClaimLoading: { [key: string]: boolean } = {};
    employeeAccounts.forEach((employeeAccount) => {
      setClaimTokenLoading({ [employeeAccount.pda]: false });
      const currentClaimableTokens = claimableTokens(
        employeeAccount.startTime,
        employeeAccount.endTime,
        employeeAccount.cliffTime,
        employeeAccount.totalAmount,
        employeeAccount.totalWithdrawn,
        Math.floor(Date.now() / 1000) // Current time in seconds
      ).toFixed(2);
      initialClaimableTokens[employeeAccount.pda] = currentClaimableTokens;
      initialClaimLoading[employeeAccount.pda] = false;
    });
    setClaimableTokenMap(initialClaimableTokens);
    setClaimTokenLoading(initialClaimLoading);
  }, [employeeAccounts, claimableTokens]);

  const refreshClaimableTokens = (
    pda: string,
    startTime: number,
    endTime: number,
    cliffTime: number,
    totalAmount: number,
    totalWithdrawn: number,
    currentTime: number
  ) => {
    const currentClaimableTokens = claimableTokens(
      startTime,
      endTime,
      cliffTime,
      totalAmount,
      totalWithdrawn,
      currentTime
    ).toFixed(2);
    setClaimableTokenMap((prev) => ({
      ...prev,
      [pda]: currentClaimableTokens,
    }));
  };

  return (
    <div className="flex justify-center flex-col gap-4 mt-8">
      <div className="container mx-auto">
        <div className="md:relative flex flex-col-reverse gap-4">
          <h1 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 md:mb-12 text-center">
            Employees Vesting Account List
          </h1>
        </div>
        {employeeAccounts.length > 0 ? (
          <div className="w-full overflow-y-auto h-[calc(100vh-250px)]">
            <PerfectScrollbar>
              <div
                className={`grid gap-6 w-full ${
                  employeeAccounts.length === 1
                    ? "grid-cols-1 justify-center"
                    : employeeAccounts.length === 2
                    ? "grid-cols-1 md:grid-cols-2 justify-center"
                    : employeeAccounts.length === 3
                    ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 justify-center"
                    : "sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                }`}
              >
                {employeeAccounts.map((employeeAccount) => (
                  <div
                    key={employeeAccount.pda}
                    className="w-full bg-gray-800 border border-gray-700 shadow-lg rounded-lg p-3 md:p-6 hover:shadow-xl hover:bg-gray-700 transition-all duration-300"
                  >
                    <div className="mb-2">
                      <h2 className="text-lg font-semibold text-blue-400 mb-2">
                        Account
                      </h2>
                      <p className="text-sm text-gray-300 break-all h-10">
                        {employeeAccount.pda}
                      </p>
                    </div>
                    <div className="mb-2">
                      <h2 className="text-lg font-semibold text-blue-400 mb-2">
                        Wallet Address
                      </h2>
                      <p className="text-sm text-gray-300 break-all h-10">
                        {employeeAccount.beneficiary}
                      </p>
                    </div>
                    <div className="mb-2">
                      <h2 className="text-lg font-semibold text-blue-400 mb-2">
                        Token
                      </h2>
                      <p className="text-sm text-gray-300 break-all h-10">
                        {employeeAccount.token}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <h3 className="text-sm font-semibold text-blue-400">
                          Start
                        </h3>
                        <p className="text-xs text-gray-300">
                          {new Date(
                            employeeAccount.startTime * 1000
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-blue-400">
                          Cliff
                        </h3>
                        <p className="text-xs text-gray-300">
                          {new Date(
                            employeeAccount.cliffTime * 1000
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <h3 className="text-sm font-semibold text-blue-400">
                          End
                        </h3>
                        <p className="text-xs text-gray-300">
                          {new Date(
                            employeeAccount.endTime * 1000
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-blue-400">
                          Total
                        </h3>
                        <p className="text-xs text-gray-300">
                          {employeeAccount.totalAmount}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <h3 className="text-sm font-semibold text-blue-400">
                        Already Withdrawn :
                      </h3>
                      <p className="text-xs text-gray-300 flex items-center gap-2">
                        {employeeAccount.totalWithdrawn}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <h3 className="text-sm font-semibold text-blue-400">
                        Claimable Token :
                      </h3>
                      <p className="text-xs text-gray-300 flex items-center gap-2">
                        <span>{claimableTokenMap[employeeAccount.pda]}</span>
                        <span
                          onClick={() =>
                            refreshClaimableTokens(
                              employeeAccount.pda,
                              employeeAccount.startTime,
                              employeeAccount.endTime,
                              employeeAccount.cliffTime,
                              employeeAccount.totalAmount,
                              employeeAccount.totalWithdrawn,
                              Math.floor(Date.now() / 1000)
                            )
                          }
                          className="text-md cursor-pointer md:scale-110 hover:scale-125 active:scale-95"
                        >
                          <IoMdRefresh />
                        </span>
                      </p>
                    </div>
                    <div
                      onClick={async () => {
                        setClaimTokenLoading((prev) => ({
                          ...prev,
                          [employeeAccount.pda]: true,
                        }));
                        console.log(claimTokenLoading);
                        // setClaimTokenLoading((prev) => {
                        //   const match = Object.keys(prev).find(
                        //     (ele) => ele === employeeAccount.pda
                        //   );
                        //   console.log("MATv", match);
                        //   if (match) {
                        //     const final = { ...prev, [match]: true };
                        //     console.log(
                        //       "FINAL ",
                        //       final,
                        //       employeeAccount.pda,
                        //       claimTokenLoading[`${employeeAccount.pda}`]
                        //     );

                        //     return final;
                        //   }
                        //   console.log("reach");
                        //   return prev;
                        // });
                        await claimTokens({
                          companyName: employeeAccount.companyName,
                          vestingAccountPubkey: new PublicKey(
                            employeeAccount.vestingAccount
                          ),
                          employeeAccountPubkey: new PublicKey(
                            employeeAccount.pda
                          ),
                          mintPubkey: new PublicKey(employeeAccount.token),
                          treasuryTokenAccountPubkey: new PublicKey(
                            employeeAccount.treasuryTokenAccount
                          ),
                        });
                      }}
                      className="cursor-pointer w-full text-center font-semibold border border-gray-500 rounded-md px-4 py-2 transition-all hover:bg-gray-800 active:scale-95 md:text-xl"
                    >
                      {claimTokenLoading[employeeAccount.pda] ? (
                        <Loader width={35} height={35} color="gray-900" />
                      ) : (
                        "Claim Your Token"
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </PerfectScrollbar>
          </div>
        ) : (
          <p className="text-gray-600 text-center">
            No employee vesting accounts found.
          </p>
        )}
      </div>
    </div>
  );
}
