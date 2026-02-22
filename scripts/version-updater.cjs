// Custom updater for version badges in README.md
module.exports.readVersion = function (contents) {
  const match = contents.match(/https:\/\/img\.shields\.io\/badge\/version-(.+?)-blue/);
  return match ? match[1] : null;
};

module.exports.writeVersion = function (contents, version) {
  return contents.replace(
    /https:\/\/img\.shields\.io\/badge\/version-(.+?)-blue/,
    `https://img.shields.io/badge/version-${version}-blue`
  );
};
