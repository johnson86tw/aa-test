import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator'
import { createKernelAccount, createKernelAccountClient, createZeroDevPaymasterClient } from '@zerodev/sdk'
import { KERNEL_V3_1 } from '@zerodev/sdk/constants'
import { http, createPublicClient, type Address, zeroAddress, encodeAbiParameters, encodePacked } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { ENTRYPOINT_ADDRESS_V07, bundlerActions } from 'permissionless'
import 'dotenv/config'
import { getScheduledTransferData, getScheduledTransfersExecutor } from '@rhinestone/module-sdk'
import { erc7579Actions } from 'permissionless/actions/erc7579'

// account: https://sepolia.etherscan.io/address/0x469874C9e35c19fbF2eaC9fbA3a1cc397023FF68

const MTK_ADDRESS = '0x2bb2F59B2F316e1Fd68616b83920A1fe15E32a81'
const recipient = '0xd78B5013757Ea4A7841811eF770711e6248dC282' // dev
const startDate = Math.floor(Date.now() / 1000) // UNIX timestamp
const executeInterval = 60 // 1 minute
const numberOfExecutions = 2

// ===============================================================================

const PROJECT_ID = process.env.ZERODEV_PROJECT_ID as string
const PRIVATE_KEY = process.env.PRIVATE_KEY as string

if (!PROJECT_ID || !PRIVATE_KEY) {
	throw new Error('Please set your project id and private key in a .env file')
}

const BUNDLER_RPC = `https://rpc.zerodev.app/api/v2/bundler/${PROJECT_ID}`
const PAYMASTER_RPC = `https://rpc.zerodev.app/api/v2/paymaster/${PROJECT_ID}`

const chain = sepolia
const entryPoint = ENTRYPOINT_ADDRESS_V07
const kernelVersion = KERNEL_V3_1

const main = async () => {
	const signer = privateKeyToAccount(`0x${PRIVATE_KEY}`)
	console.log('signer', signer.address)

	const publicClient = createPublicClient({
		transport: http(BUNDLER_RPC),
	})

	const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
		signer,
		entryPoint,
		kernelVersion,
	})

	// Construct a Kernel account
	const account = await createKernelAccount(publicClient, {
		plugins: {
			sudo: ecdsaValidator,
		},
		entryPoint,
		kernelVersion,
	})

	console.log('account', account.address)
}

main()
