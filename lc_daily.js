import { gql, request } from "graphql-request";

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
