import "./DepositPage.scss"

import { ALETH_POOL_NAME, VETH2_POOL_NAME } from "../constants"
import { Button, Center } from "@chakra-ui/react"
import { PoolDataType, UserShareType } from "../hooks/usePoolData"
import React, { ReactElement, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { useDispatch, useSelector } from "react-redux"

import { AppDispatch } from "../state"
import { AppState } from "../state"
import ConfirmTransaction from "./ConfirmTransaction"
import DeadlineField from "./DeadlineField"
import { DepositTransaction } from "../interfaces/transactions"
import GasField from "./GasField"
import InfiniteApprovalField from "./InfiniteApprovalField"
import LPStakingBanner from "./LPStakingBanner"
import Modal from "./Modal"
import MyShareCard from "./MyShareCard"
import { PayloadAction } from "@reduxjs/toolkit"
import PoolInfoCard from "./PoolInfoCard"
import ReviewDeposit from "./ReviewDeposit"
import SlippageField from "./SlippageField"
import TokenInput from "./TokenInput"
import TopMenu from "./TopMenu"
import { Zero } from "@ethersproject/constants"
import classNames from "classnames"
import { formatBNToPercentString } from "../utils"
import { logEvent } from "../utils/googleAnalytics"
import { updatePoolAdvancedMode } from "../state/user"

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Props {
  title: string
  onConfirmTransaction: () => Promise<void>
  onChangeTokenInputValue: (tokenSymbol: string, value: string) => void
  tokens: Array<{
    symbol: string
    name: string
    icon: string
    max: string
    inputValue: string
  }>
  exceedsWallet: boolean
  selected?: { [key: string]: any }
  poolData: PoolDataType | null
  myShareData: UserShareType | null
  transactionData: DepositTransaction
}

/* eslint-enable @typescript-eslint/no-explicit-any */
const DepositPage = (props: Props): ReactElement => {
  const { t } = useTranslation()
  const {
    tokens,
    exceedsWallet,
    poolData,
    myShareData,
    transactionData,
    onChangeTokenInputValue,
    onConfirmTransaction,
  } = props

  const [currentModal, setCurrentModal] = useState<string | null>(null)

  const dispatch = useDispatch<AppDispatch>()
  const { userPoolAdvancedMode: advanced } = useSelector(
    (state: AppState) => state.user,
  )
  const validDepositAmount = transactionData.to.totalAmount.gt(0)

  return (
    <div className="deposit">
      <TopMenu activeTab={"deposit"} />
      {poolData?.aprs?.keep?.apr.gt(Zero) &&
        myShareData?.lpTokenBalance.gt(0) && (
          <LPStakingBanner
            stakingLink={"https://dashboard.keep.network/liquidity"}
          />
        )}
      {poolData?.name === VETH2_POOL_NAME &&
        myShareData?.lpTokenBalance.gt(0) && (
          <LPStakingBanner stakingLink={"https://www.sharedstake.org/earn"} />
        )}
      {poolData?.name === ALETH_POOL_NAME &&
        myShareData?.lpTokenBalance.gt(0) && (
          <LPStakingBanner stakingLink={"https://app.alchemix.fi/farms"} />
        )}

      <div className="content">
        <div className="left">
          <div className="form">
            <h3>{t("addLiquidity")}</h3>
            {exceedsWallet ? (
              <div className="error">{t("depositBalanceExceeded")}</div>
            ) : null}
            {poolData?.isPaused && poolData?.name === VETH2_POOL_NAME ? (
              <div className="error">
                <Trans i18nKey="sgtPoolPaused" t={t}>
                  This pool is paused, please see{" "}
                  <a
                    href="https://medium.com/immunefi/sharedstake-insider-exploit-postmortem-17fa93d5c90e"
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: "underline" }}
                  >
                    this postmortem
                  </a>{" "}
                  for more information.
                </Trans>
              </div>
            ) : null}
            {tokens.map((token, index) => (
              <div key={index}>
                <TokenInput
                  {...token}
                  disabled={poolData?.isPaused}
                  onChange={(value): void =>
                    onChangeTokenInputValue(token.symbol, value)
                  }
                />
                {index === tokens.length - 1 ? (
                  ""
                ) : (
                  <div className="divider"></div>
                )}
              </div>
            ))}
            <div className={classNames("transactionInfoContainer", "show")}>
              <div className="transactionInfo">
                {poolData?.aprs?.keep?.apr.gt(Zero) && (
                  <div className="transactionInfoItem">
                    <a
                      href="https://docs.saddle.finance/faq#what-are-saddles-liquidity-provider-rewards"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>{`KEEP APR:`}</span>
                    </a>{" "}
                    <span className="value">
                      {formatBNToPercentString(poolData.aprs.keep.apr, 18)}
                    </span>
                  </div>
                )}
                {poolData?.aprs?.sharedStake?.apr.gt(Zero) && (
                  <div className="transactionInfoItem">
                    <a
                      href="https://docs.saddle.finance/faq#what-are-saddles-liquidity-provider-rewards"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>{`SGT APR:`}</span>
                    </a>{" "}
                    <span className="value">
                      {formatBNToPercentString(
                        poolData.aprs.sharedStake.apr,
                        18,
                      )}
                    </span>
                  </div>
                )}
                <div className="transactionInfoItem">
                  {transactionData.priceImpact.gte(0) ? (
                    <span className="bonus">{`${t("bonus")}: `}</span>
                  ) : (
                    <span className="slippage">{t("priceImpact")}</span>
                  )}
                  <span
                    className={
                      "value " +
                      (transactionData.priceImpact.gte(0)
                        ? "bonus"
                        : "slippage")
                    }
                  >
                    {" "}
                    {formatBNToPercentString(
                      transactionData.priceImpact,
                      18,
                      4,
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="advancedOptions">
            <span
              className="title"
              onClick={(): PayloadAction<boolean> =>
                dispatch(updatePoolAdvancedMode(!advanced))
              }
            >
              {t("advancedOptions")}
              <span
                className={classNames({
                  iconArrow: true,
                  upsideDown: advanced,
                })}
              ></span>
            </span>
            <div className="divider"></div>
            <div className={"tableContainer" + classNames({ show: advanced })}>
              <div className="parameter">
                <InfiniteApprovalField />
              </div>
              <div className="parameter">
                <SlippageField />
              </div>
              <div className="parameter">
                <DeadlineField />
              </div>
              <div className="parameter">
                <GasField />
              </div>
            </div>
          </div>
          <Center width="100%" py={6}>
            <Button
              variant="primary"
              size="lg"
              width="240px"
              onClick={(): void => {
                setCurrentModal("review")
              }}
              disabled={!validDepositAmount || poolData?.isPaused}
            >
              {t("deposit")}
            </Button>
          </Center>
        </div>
        <div className="infoPanels">
          <MyShareCard data={myShareData} />
          <div
            style={{
              display: myShareData ? "block" : "none",
            }}
            className="divider"
          ></div>{" "}
          <PoolInfoCard data={poolData} />
        </div>
        <Modal
          isOpen={!!currentModal}
          onClose={(): void => setCurrentModal(null)}
        >
          {currentModal === "review" ? (
            <ReviewDeposit
              transactionData={transactionData}
              onConfirm={async (): Promise<void> => {
                setCurrentModal("confirm")
                logEvent(
                  "deposit",
                  (poolData && { pool: poolData?.name }) || {},
                )
                await onConfirmTransaction?.()
                setCurrentModal(null)
              }}
              onClose={(): void => setCurrentModal(null)}
            />
          ) : null}
          {currentModal === "confirm" ? <ConfirmTransaction /> : null}
        </Modal>
      </div>
    </div>
  )
}

export default DepositPage
