import { ethers } from "hardhat";
import { expect } from "chai"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"

import { Voting } from "../typechain-types";

describe("Voting", () => {

    let ownerAcc: SignerWithAddress
    let acc2: SignerWithAddress

    let voting: Voting


    beforeEach(async () => {
        [ownerAcc, acc2] = await ethers.getSigners()

        const votingFactory = await ethers.getContractFactory("Voting", ownerAcc)

        voting = await votingFactory.deploy()

        await voting.deployed()
    })

    it("User can commit vote", async () => {

        const voter = acc2

        const userSecretBytes = ethers.utils.formatBytes32String("1337")
        const candidate = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"

        const voteHash = ethers.utils.solidityKeccak256(["address", "bytes32", "address"], [candidate, userSecretBytes, voter.address])

        const voteTx = await voting.connect(voter).commitVote(voteHash)
        await voteTx.wait()

        const commit = await voting.commits(voter.address)

        expect(commit.hash).equal(voteHash)
    })

    it("User cannot vote twice", async () => {

        const voter = acc2

        const userSecretBytes = ethers.utils.formatBytes32String("1337")
        const candidate = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"

        const voteHash = ethers.utils.solidityKeccak256(["address", "bytes32", "address"], [candidate, userSecretBytes, voter.address])

        const voteTx = await voting.connect(voter).commitVote(voteHash)
        await voteTx.wait()

        const voteTx2 = voting.connect(voter).commitVote(voteHash)

        await expect(voteTx2).to.rejectedWith("Already voted")
    })

    it("User cannot vote if votting stopped", async () => {

        await voting.connect(ownerAcc).stopVoting()

        const voter = acc2

        const userSecretBytes = ethers.utils.formatBytes32String("1337")
        const candidate = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"

        const voteHash = ethers.utils.solidityKeccak256(["address", "bytes32", "address"], [candidate, userSecretBytes, voter.address])

        const voteTx = voting.connect(voter).commitVote(voteHash)
        await expect(voteTx).to.rejectedWith("Voting stopped")
    })

    it("User can reveal vote", async () => {
        const voter = acc2

        const userSecretBytes = ethers.utils.formatBytes32String("1337")
        const candidate = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"

        const voteHash = ethers.utils.solidityKeccak256(["address", "bytes32", "address"], [candidate, userSecretBytes, voter.address])

        const voteTx = await voting.connect(voter).commitVote(voteHash)
        await voteTx.wait()

        await voting.connect(ownerAcc).stopVoting()

        const revealVoteTx = voting.connect(voter).revealVote(candidate, userSecretBytes)
        await expect(revealVoteTx).to.rejectedWith("Voting stopped")

    })

    it("User cannot reveal vote if voting stopped", async () => {
        const voter = acc2

        const userSecretBytes = ethers.utils.formatBytes32String("1337")
        const candidate = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"

        const voteHash = ethers.utils.solidityKeccak256(["address", "bytes32", "address"], [candidate, userSecretBytes, voter.address])

        const votesBefore = await voting.votes(candidate)

        const voteTx = await voting.connect(voter).commitVote(voteHash)
        await voteTx.wait()

        await voting.connect(voter).revealVote(candidate, userSecretBytes)

        const commit = await voting.commits(voter.address)
        expect(commit.revealed).equal(true)

        const votesAfter = await voting.votes(candidate)
        expect(votesAfter).equal(votesBefore.add(1))
    })


    it("User cannot reveal vote twice", async () => {
        const voter = acc2

        const userSecretBytes = ethers.utils.formatBytes32String("1337")
        const candidate = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"

        const voteHash = ethers.utils.solidityKeccak256(["address", "bytes32", "address"], [candidate, userSecretBytes, voter.address])

        const voteTx = await voting.connect(voter).commitVote(voteHash)
        await voteTx.wait()

        await voting.connect(voter).revealVote(candidate, userSecretBytes)
        const revealTx2 = voting.connect(voter).revealVote(candidate, userSecretBytes)

        await expect(revealTx2).to.rejectedWith("Already revealed")
    })

    it("User cannot reveal with invalid secret key", async () => {
        const voter = acc2

        const userSecretBytes = ethers.utils.formatBytes32String("1337")
        const candidate = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"

        const voteHash = ethers.utils.solidityKeccak256(["address", "bytes32", "address"], [candidate, userSecretBytes, voter.address])

        const voteTx = await voting.connect(voter).commitVote(voteHash)
        await voteTx.wait()

        const fakeUserSecretBytes = ethers.utils.formatBytes32String("bushdio")
        const revealTx = voting.connect(voter).revealVote(candidate, fakeUserSecretBytes)

        await expect(revealTx).to.rejectedWith("Invalid commit")
    })

    it("User cannot change candidate on reveal", async () => {
        const voter = acc2

        const userSecretBytes = ethers.utils.formatBytes32String("1337")
        const candidate = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"

        const voteHash = ethers.utils.solidityKeccak256(["address", "bytes32", "address"], [candidate, userSecretBytes, voter.address])

        const voteTx = await voting.connect(voter).commitVote(voteHash)
        await voteTx.wait()

        const fakeCandidate = "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2"
        const revealTx = voting.connect(voter).revealVote(fakeCandidate, userSecretBytes)

        await expect(revealTx).to.rejectedWith("Invalid commit")
    })

})