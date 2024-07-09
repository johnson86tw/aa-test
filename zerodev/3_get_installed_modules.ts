import { getAccount, getInstalledModules } from '@rhinestone/module-sdk'
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator'
import { KERNEL_V3_1 } from '@zerodev/sdk/constants'
import { http, createPublicClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { ENTRYPOINT_ADDRESS_V07 } from 'permissionless'
import 'dotenv/config'

// account: https://sepolia.etherscan.io/address/0x469874C9e35c19fbF2eaC9fbA3a1cc397023FF68

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
	const publicClient = createPublicClient({
		transport: http(BUNDLER_RPC),
	})

	const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
		signer,
		entryPoint,
		kernelVersion,
	})

	const account = getAccount({
		address: '0x469874C9e35c19fbF2eaC9fbA3a1cc397023FF68',
		type: 'kernel',
		deployedOnChains: [11155111], // optional
	})

	console.log('account', account.address)

	const installedModules = await getInstalledModules({
		client: publicClient, // The client object of type PublicClient from viem
		account: account, // The account object
	})

	console.log('installedModules', installedModules)
}

main()
