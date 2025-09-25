function shuffleArray(array) {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

function buildGroups(teams) {
  const groups = [];
  let groupIndex = 0;

  for (let i = 0; i < teams.length; i += 4) {
    const chunk = teams.slice(i, i + 4);
    groups.push({
      groupName: String.fromCharCode(65 + groupIndex), // A, B, C...
      teams: chunk.map(t => ({ team: t._id, teamName: t.teamName, teamCode: t.teamCode }))
    });
    groupIndex++;
  }

  if (groups.length > 1 && groups[groups.length - 1].teams.length === 1) {
    for (let i = 0; i < groups.length - 1; i++) {
      if (groups[i].teams.length > 2) {
        const movedTeam = groups[i].teams.pop();
        groups[groups.length - 1].teams.push(movedTeam);
        break;
      }
    }
  }

  return groups;
}

module.exports = { shuffleArray, buildGroups };
