import { gql, request } from "graphql-request";

// fires the 'func' at the given 'hour' and 'minute' in UTC
export function fireAtTime(hour, minute, func) {
	const now = new Date();
	const targetTime = createDateWithUTCTime(hour, minute);
	// const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);

	if (now > targetTime) {
		targetTime.setDate(targetTime.getDate() + 1);
	}

	const delay = targetTime - now;
	setTimeout(() => {
		func();
		setInterval(() => {
			func();
		}, 24 * 60 * 60 * 1000); // 24 hours
	}, delay);
}

// queries leetcode for the daily link
const getDailyQuery = gql`
	query {
		activeDailyCodingChallengeQuestion {
			link
		}
	}
`;

export async function fetchDaily() {
	const res = await request("https://leetcode.com/graphql", getDailyQuery);
	const link =
		"https://leetcode.com" + res["activeDailyCodingChallengeQuestion"]["link"];

	const now = new Date();
	const message_to_send =
		"Daily " + (now.getUTCMonth() + 1) + "/" + now.getUTCDate() + ": " + link;
	return message_to_send;
}

function createDateWithUTCTime(hourUTC, minuteUTC) {
	const now = new Date();

	// Create a new date object for the current date with specified UTC time
	const targetDate = new Date(
		Date.UTC(
			now.getUTCFullYear(),
			now.getUTCMonth(),
			now.getUTCDate(),
			hourUTC,
			minuteUTC,
			0, // Seconds
			0 // Milliseconds
		)
	);

	return targetDate;
}
