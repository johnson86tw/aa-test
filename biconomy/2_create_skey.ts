import {
	createSession,
	createSessionKeyEOA,
	createSmartAccountClient,
	getChain,
	PaymasterMode,
	type Policy,
	type Rule,
} from '@biconomy/account'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const BICONOMY_PAYMASTER_API_KEY = process.env.BICONOMY_PAYMASTER_API_KEY as string
const PRIVATE_KEY = process.env.PRIVATE_KEY as string

if (!BICONOMY_PAYMASTER_API_KEY || !PRIVATE_KEY) {
	throw new Error('Please set your project id and private key in a .env file')
}

const chainId = 11155111
const chain = getChain(chainId)

const BUNDLER_RPC = `https://bundler.biconomy.io/api/v2/${chainId}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44`

const signer = privateKeyToAccount(`0x${PRIVATE_KEY}`)
console.log('signer', signer.address)

const client = createWalletClient({
	account: signer,
	chain,
	transport: http(),
})

const account = await createSmartAccountClient({
	signer: client,
	biconomyPaymasterApiKey: BICONOMY_PAYMASTER_API_KEY,
	bundlerUrl: BUNDLER_RPC,
})

const address = await account.getAccountAddress()

console.log('AA address', address)

const { sessionKeyAddress, sessionStorageClient } = await createSessionKeyEOA(account, chain)

console.log('sessionKeyAddress', sessionKeyAddress)

const nftAddress = '0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e'

const rules: Rule[] = [
	{
		/** The index of the param from the selected contract function upon which the condition will be applied */
		offset: 0,
		/**
		 * Conditions:
		 *
		 * 0 - Equal
		 * 1 - Less than or equal
		 * 2 - Less than
		 * 3 - Greater than or equal
		 * 4 - Greater than
		 * 5 - Not equal
		 */
		condition: 0,
		/** The value to compare against */
		referenceValue: address,
	},
]

/** The policy is made up of a list of rules applied to the contract method with and interval */
const policy: Policy[] = [
	{
		/** The address of the sessionKey upon which the policy is to be imparted */
		sessionKeyAddress,
		/** The address of the contract to be included in the policy */
		contractAddress: nftAddress,
		/** The specific function selector from the contract to be included in the policy */
		functionSelector: 'safeMint(address)',
		/** The list of rules which make up the policy */
		rules,
		/** The time interval within which the session is valid. Setting both to 0 will keep a session alive indefinitely */
		interval: {
			validUntil: 0,
			validAfter: 0,
		},
		/** The maximum value that can be transferred in a single transaction */
		valueLimit: 0n,
	},
]

const { wait, session } = await createSession(account, policy, sessionStorageClient, {
	paymasterServiceData: { mode: PaymasterMode.SPONSORED },
})

const {
	receipt: { transactionHash },
	success,
} = await wait()

console.log('transactionHash', transactionHash)
console.log('success', success)

console.log('session', session)
