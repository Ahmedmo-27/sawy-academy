function getPrerequisiteMessage(levelOrder, isAuthenticated) {
  if (levelOrder <= 1) return undefined;
  const previous = levelOrder - 1;
  return isAuthenticated
    ? `Complete Level ${previous} first`
    : `Sign in and complete Level ${previous} to unlock`;
}

function isLevelLocked(levelOrder, previousLevelCompleted) {
  return levelOrder > 1 && !previousLevelCompleted;
}

module.exports = {
  getPrerequisiteMessage,
  isLevelLocked,
};
