// SPDX-License-Identifier: MIT
import "./Utils/Ownable.sol";

pragma solidity ^0.8.0;

contract Voting is Ownable {
    mapping(address => Commit) public commits;
    mapping(address => uint) public votes;

    struct Commit {
        bytes32 hash;
        bool revealed;
    }

    bool votingStopped = false;

    modifier votingNotStopped() {
        require(!votingStopped, "Voting stopped");
        _;
    }

    function commitVote(bytes32 _hashedVote) external votingNotStopped {
        require(commits[msg.sender].hash == bytes32(0), "Already voted");

        commits[msg.sender].hash = _hashedVote;
    }

    function revealVote(address _candidate, bytes32 _secret)
        external
        votingNotStopped
    {
        bytes32 commit = keccak256(
            abi.encodePacked(_candidate, _secret, msg.sender)
        );

        require(commits[msg.sender].revealed == false, "Already revealed");
        require(commit == commits[msg.sender].hash, "Invalid commit");

        commits[msg.sender].revealed = true;
        votes[_candidate]++;
    }

    function stopVoting() external onlyOwner {
        require(!votingStopped);

        votingStopped = true;
    }
}
