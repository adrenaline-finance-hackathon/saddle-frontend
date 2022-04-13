import {
  Alert,
  Box,
  Button,
  DialogContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material"
import { AssetType, PoolType, TextFieldColors } from "."
import { BigNumber, BigNumberish, ethers } from "ethers"
import {
  MASTER_REGISTRY_CONTRACT_ADDRESSES,
  PERMISSIONLESS_DEPLOYER_CONTRACT_ADDRESSES,
} from "../../constants"
import { enqueuePromiseToast, enqueueToast } from "../../components/Toastify"

import Dialog from "../../components/Dialog"
import DialogTitle from "../../components/DialogTitle"
import PERMISSIONLESS_DEPLOYER_CONTRACT_ABI from "../../constants/abis/permissionlessDeployer.json"
import POOL_REGISTRY_ABI from "../../constants/abis/poolRegistry.json"
import { PermissionlessDeployer } from "../../../types/ethers-contracts/PermissionlessDeployer"
import { PoolRegistry } from "../../../types/ethers-contracts/PoolRegistry"
import React from "react"
import { getContract } from "../../utils"
import { parseUnits } from "@ethersproject/units"
import { useActiveWeb3React } from "../../hooks"
import { useTranslation } from "react-i18next"

type Props = {
  open: boolean
  onClose?: () => void
  poolData: {
    poolName: string
    poolSymbol: string
    aParameter: string
    poolType: PoolType
    fee: string
    assetType: AssetType
    tokenInputs: string[]
    tokenInfo: {
      name: string
      symbol: string
      decimals: BigNumberish
      checkResult: TextFieldColors
    }[]
  }
  resetFields: () => void
}

const POOL_FEE_PERCISION = 8

export default function ReviewCreatePool({
  open,
  onClose = () => null,
  poolData,
  resetFields,
}: Props): JSX.Element {
  const { t } = useTranslation()
  const { account, chainId, library } = useActiveWeb3React()

  const onCreatePoolClick = async () => {
    if (!library || !chainId || !account) return

    const permissionlessDeployerContract = getContract(
      PERMISSIONLESS_DEPLOYER_CONTRACT_ADDRESSES[chainId],
      PERMISSIONLESS_DEPLOYER_CONTRACT_ABI,
      library,
      account,
    ) as PermissionlessDeployer

    const poolRegistry = getContract(
      MASTER_REGISTRY_CONTRACT_ADDRESSES[chainId],
      POOL_REGISTRY_ABI,
      library,
      account,
    ) as PoolRegistry

    const enqueueCreatePoolToast = async (deployTxn: {
      wait: () => Promise<unknown>
    }) =>
      await enqueuePromiseToast(
        chainId,
        deployTxn.wait(),
        "createPermissionlessPool",
        {
          poolName: poolData.poolName,
        },
      )
    // const decimals = poolData.tokenInfo.map((token) => token.decimals)
    const decimals = [6, 18]

    console.log({ poolData })
    try {
      let deployTxn
      const deploySwapInput = {
        poolName: ethers.utils.formatBytes32String(poolData.poolName),
        tokens: poolData.tokenInputs,
        decimals,
        adminFee: BigNumber.from(50e8), // 50%
        lpTokenName: poolData.poolName,
        lpTokenSymbol: poolData.poolSymbol,
        a: BigNumber.from(poolData.aParameter),
        fee: BigNumber.from(parseUnits(poolData.fee, POOL_FEE_PERCISION)),
        owner: account,
        typeOfAsset: poolData.assetType,
      }
      if (poolData.poolType === "basepool") {
        deployTxn = await permissionlessDeployerContract.deploySwap(
          deploySwapInput,
        )
        await enqueueCreatePoolToast(deployTxn)
      } else {
        let poolRegistryData
        let deployMetaSwapInput
        try {
          poolRegistryData = await poolRegistry.getPoolDataByName(
            ethers.utils.formatBytes32String(poolData.poolName),
          )
          deployMetaSwapInput = {
            ...deploySwapInput,
            baseSwap: poolRegistryData.poolAddress,
            tokens: [...poolData.tokenInputs, poolRegistryData.lpToken],
          }
        } catch (err) {
          console.error(err, "err3")
        }

        if (poolRegistryData?.poolName && deployMetaSwapInput) {
          deployTxn = await permissionlessDeployerContract.deployMetaSwap(
            deployMetaSwapInput,
          )
          await enqueueCreatePoolToast(deployTxn)
        } else if (!poolRegistryData?.poolName) {
          await permissionlessDeployerContract.deploySwap(deploySwapInput)
          poolRegistryData = await poolRegistry.getPoolDataByName(
            ethers.utils.formatBytes32String(poolData.poolName),
          )
          deployMetaSwapInput = {
            ...deploySwapInput,
            baseSwap: poolRegistryData.poolAddress,
            tokens: [...poolData.tokenInputs, poolRegistryData.lpToken],
          }
          deployTxn = await permissionlessDeployerContract.deployMetaSwap(
            deployMetaSwapInput,
          )
          await enqueueCreatePoolToast(deployTxn)
        }
      }
      console.log({ deployTxn })
      resetFields()
    } catch (err) {
      console.error(err, "err2")
      enqueueToast("error", "Unable to deploy Permissionless Pool")
    }
    onClose()
  }

  const warningMessage =
    "Double check the inputs for your pool are as you want it. Once a pool is created it can be modified but can't be deleted. It will live on the blockchain forever!"
  const outputEstimatedMsg =
    "Output is estimated. If the input is invalid or the gas is too low, your transaction will revert."

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle variant="h1">Review Pool Creation</DialogTitle>
      <DialogContent>
        <Alert icon={false} color="warning">
          {warningMessage}
        </Alert>
        <Stack my={3} spacing={1}>
          <Box display="flex" justifyContent="space-between">
            <Typography>{t("poolName")}</Typography>
            <Typography>{poolData.poolName}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography>{t("poolSymbol")}</Typography>
            <Typography>{poolData.poolSymbol}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography>{t("fee")}</Typography>
            <Typography>{poolData.fee}%</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography>{t("aParameter")}</Typography>
            <Typography>{poolData.aParameter}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography>{t("poolType")}</Typography>
            <Typography>{t(poolData.poolType)}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography>Tokens</Typography>
            <Typography>
              {poolData.tokenInfo.map(
                (token, i) => (i ? ", " : "") + token.name,
              )}
            </Typography>
          </Box>
        </Stack>
        <Divider />
        <Typography my={3}>{outputEstimatedMsg}</Typography>
        <Stack spacing={1}>
          <Button variant="contained" size="large" onClick={onCreatePoolClick}>
            Create Pool
          </Button>
          <Button onClick={onClose} size="large">
            Go back to edit
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
