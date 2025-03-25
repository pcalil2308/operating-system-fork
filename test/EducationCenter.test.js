const { advanceBlock } = require("./shared/advance_block");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EducationCenter", () => {
  let instance;
  let owner, user1Address, user2Address;

  const addContent = async (from) => {
    await instance.connect(from).addContent("id", "title", "description",  "fileURL", "photo");
  };

  beforeEach(async () => {
    [owner, user1Address, user2Address] = await ethers.getSigners();

    const educationCenterFactory = await ethers.getContractFactory("EducationCenter");
    instance = await educationCenterFactory.deploy();
  });

  describe("addContent", () => {
    it("must add content", async () => {
    });
  });

  describe("getContent", () => {
    it("must get content", async () => {
    });
  });  
});
