import { getCreateScheduledTransferAction, getScheduledTransferData } from '@rhinestone/module-sdk'

const MTK_ADDRESS = '0x2bb2F59B2F316e1Fd68616b83920A1fe15E32a81'
const recipient = '0xd78B5013757Ea4A7841811eF770711e6248dC282' // dev
const startDate = Math.floor(Date.now() / 1000) // UNIX timestamp
const executeInterval = 60 // 1 minute
const numberOfExecutions = 2

const data = getScheduledTransferData({
	scheduledTransfer: {
		token: {
			token_address: MTK_ADDRESS,
			decimals: 18,
		},
		amount: 1,
		recipient,
		startDate,
		repeatEvery: executeInterval,
		numberOfRepeats: numberOfExecutions,
	},
})

console.log('calldata', data)
