// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;

/**
 * @title Sintrop Education v1
 * @dev First version of the Sintrop Education Center
 * @notice Store & retrieve education contents
 */
contract EducationCenter {
  uint256 contentsCount;
  mapping(uint256 => Content) public contents;

  struct Content {
    uint256 id;
    string title;
    string description;
    string url;
    string photo;
  }

  /**
   * @notice Publish an education content
   */
  function addContent(string memory title, string memory description, string memory url, string memory photo) public {
    contentsCount++;
    uint256 id = contentsCount;

    contents[id] = Content(id, title, description, url, photo);
  }

  /**
   * @dev Returns a content
   * @param id contentId
   */
  function getContent(uint256 id) public view returns (Content memory) {
    return contents[id];
  }
}
