export async function deleteEntry(user, company, progress) {
	try {
		Entry.destroy({
			where: {
				user: user,
				company: company,
				progress: progress,
			},
		});
	} catch (err) {
		console.error(err);
	}
}

export async function addEntry(user, company, progress) {
	try {
		const [_, created] = await Entry.findOrCreate({
			where: { user: user, company: company, progress: progress },
			defaults: {},
		});
		if (!created) {
			console.log("failed to create the database entry");
		}
	} catch (err) {
		console.error(err);
	}
}

export async function getStats(user) {
	try {
		const promises = [
			getApps(user),
			getOAs(user),
			getPhones(user),
			getTechnicals(user),
			getFinals(user),
			getOffers(user),
		];
		const results = await Promise.all(promises);
		return results;
	} catch (err) {
		console.error(err);
	}
}

async function getApps(user) {
	const entries = await Entry.findAll({
		where: {
			user: user,
			progress: "apply",
		},
	});

	return entries.length;
}

async function getOAs(user) {
	const entries = await Entry.findAll({
		where: {
			user: user,
			progress: "oa",
		},
	});
	return entries.length;
}

async function getPhones(user) {
	const entries = await Entry.findAll({
		where: {
			user: user,
			progress: "phone",
		},
	});
	return entries.length;
}

async function getTechnicals(user) {
	const entries = await Entry.findAll({
		where: {
			user: user,
			progress: "technical",
		},
	});
	return entries.length;
}

async function getFinals(user) {
	const entries = await Entry.findAll({
		where: {
			user: user,
			progress: "final",
		},
	});
	return entries.length;
}

async function getOffers(user) {
	const entries = await Entry.findAll({
		where: {
			user: user,
			progress: "offer",
		},
	});
	return entries.length;
}
