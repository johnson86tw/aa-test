import { getAccount, getInstalledModules, isModuleInstalled } from '@rhinestone/module-sdk'
import { http, createPublicClient } from 'viem'
import 'dotenv/config'

const PROJECT_ID = process.env.ZERODEV_PROJECT_ID as string
const PRIVATE_KEY = process.env.PRIVATE_KEY as string

if (!PROJECT_ID || !PRIVATE_KEY) {
	throw new Error('Please set your project id and private key in a .env file')
}

const BUNDLER_RPC = `https://rpc.zerodev.app/api/v2/bundler/${PROJECT_ID}`

const main = async () => {
	const publicClient = createPublicClient({
		transport: http(BUNDLER_RPC),
	})

	const account = getAccount({
		address: '0x469874C9e35c19fbF2eaC9fbA3a1cc397023FF68',
		type: 'kernel',
		deployedOnChains: [11155111], // optional
	})

	console.log('account', account.address)

	const installedModules = await getInstalledModules({
		client: publicClient,
		account: account,
	})

	console.log('installedModules', installedModules)

	const ecdsaValidatorIsInstalled = await isModuleInstalled({
		client: publicClient,
		account: account,
		module: {
			module: '0x845adb2c711129d4f3966735ed98a9f09fc4ce57',
			type: 'validator',
			initData: '0x',
		},
	})

	console.log(
		'Is ecdsaValidatorIsInstalled (0x845adb2c711129d4f3966735ed98a9f09fc4ce57) installed?',
		ecdsaValidatorIsInstalled,
	)

	const ScheduledTransfersIsInstalled = await isModuleInstalled({
		client: publicClient,
		account: account,
		module: {
			module: '0xf1ae317941efeb1ffb103d959ef58170f1e577e0',
			type: 'executor',
			initData: '0x',
		},
	})

	console.log(
		'Is Scheduled Transfers (0xf1ae317941efeb1ffb103d959ef58170f1e577e0) installed?',
		ScheduledTransfersIsInstalled,
	)
}

main()
