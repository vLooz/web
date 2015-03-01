module.exports = /*@ngInject*/($rootScope, $scope, $state, $timeout, $interval, $stateParams, co, user, inbox, consts, Hotkey) => {
	$scope.labelName = $stateParams.labelName;
	$scope.selectedTid = $stateParams.threadId ? $stateParams.threadId : null;
	$scope.$state = $state;

	console.log('CtrlThreadList loaded', $scope.selectedTid);

	$scope.threads = {};
	$scope.threadsList = [];
	$scope.searchText = '';
	$scope.isLoading = false;
	$scope.isLoadingSign = false;
	$scope.isDisabled = true;
	$scope.isInitialLoad = true;

	$scope.offset = 0;
	$scope.limit = 15;

	let isWatching = false;

	const requestList = () => {
		$scope.isLoading = true;
		let t = $timeout(() => {
			$scope.isLoadingSign = true;
		}, consts.LOADER_SHOW_DELAY);

		const labelName = $scope.labelName;
		co(function *(){
			try {
				const list = yield inbox.requestList($scope.labelName, $scope.offset, $scope.limit);

				if (labelName == $scope.labelName) {
					$scope.isDisabled = list.length < 1;
					$scope.offset += list.length;
				}
			} catch (err) {
				$scope.isDisabled = true;
			} finally {
				if (labelName == $scope.labelName) {
					$scope.isLoading = false;
					$scope.isLoadingSign = false;
					$timeout.cancel(t);
				}
			}
		});
	};

	$scope.selectThread = (event, tid) => {
		$state.go('main.inbox.label', {labelName: $scope.labelName, threadId: tid});
	};

	$scope.replyThread = (event, tid) => {
		event.stopPropagation(); // god damn
		$scope.showPopup('compose', {replyThreadId: tid});
	};

	$scope.searchFilter = (thread) => {
		let searchText = $scope.searchText.toLowerCase();
		return thread.subject.toLowerCase().includes(searchText) || thread.members.some(m => m.toLowerCase().includes(searchText));
	};

	$rootScope.$on(`inbox-threads`, (e, labelName) => {
		if (labelName != $scope.labelName) {
			console.log(`inbox-threads data has been rejected label should match to `, $scope.labelName);
			return;
		}

		co (function *(){
			$scope.threadsList = yield inbox.requestListDirect($scope.labelName, 0, $scope.limit);
			if (!$scope.threadsList || $scope.threadsList.length < 1)
				$state.go('main.inbox.label', {labelName: $scope.labelName});

			$scope.threads = $scope.threadsList.reduce((a, t) => {
				a[t.id] = t;
				return a;
			}, {});

			$scope.isLoading = false;
			$scope.isLoadingSign = false;
			$scope.isInitialLoad = false;

			if (!isWatching) {
				$scope.$watch('filteredThreadsList', (o, n) => {
					if (o == n)
						return;

					console.log('$scope.filteredThreadsList', $scope.filteredThreadsList, 'original', $scope.threadsList);

					const r = $scope.filteredThreadsList.find(t => t.id == $scope.selectedTid);
					if (!r)
						$rootScope.$broadcast('emails-list-hide');
					else
						$rootScope.$broadcast('emails-list-restore');
				});
				isWatching = true;
			}
		});
	});

	$rootScope.$on('$stateChangeStart', (e, toState, toParams) => {
		console.log('CtrlThreadList $stateChangeStart', toState.name, toParams);

		if (toState.name == 'main.inbox.label') {
			$scope.selectedTid = toParams.threadId ? toParams.threadId : null;
			if (toParams.labelName != $scope.labelName) {
				$scope.offset = 0;
				$scope.limit = 15;
				$scope.threads = {};
				$scope.threadsList = [];
				$scope.labelName = toParams.labelName;
				isWatching = false;
				requestList();
			}
			addHotkeys();
		}
	});

	$scope.scroll = () => {
		if ($scope.isLoading || $scope.isDisabled)
			return;

		requestList();
	};

	$scope.spamThread = (tid) => {
		console.log('$scope.spamThread', tid, $scope.threads);
		inbox.requestSetLabel($scope.threads[tid], 'Spam');
	};

	$scope.deleteThread = (tid) => {
		console.log('$scope.deleteThread', tid, $scope.threads);
		inbox.requestDelete($scope.threads[tid]);
	};

	$scope.starThread = (tid) => {
		console.log('$scope.starThread', tid, $scope.threads);
		inbox.requestSwitchLabel($scope.threads[tid], 'Starred');
	};

	requestList();

    // Add hotkeys
	const addHotkeys = () => {
		const moveThreads = (delta) => {
			let selectedIndex = $scope.threadsList && $scope.selectedTid !== null
				? $scope.threadsList.findIndex(thread => thread.id == $scope.selectedTid)
				: -1;
			if ($scope.selectedTid !== null) {
				selectedIndex = Math.min(Math.max(selectedIndex + delta, 0), $scope.threadsList.length - 1);
				$scope.selectedTid = $scope.threadsList[selectedIndex].id;
				$scope.selectThread(null, $scope.selectedTid);
			}
		};

		const moveUp = (event, key) => {
			event.preventDefault();
			moveThreads(-1);
		};

		const moveDown = (event, key) => {
			event.preventDefault();
			moveThreads(1);
		};
		
		Hotkey.addHotkey({
			combo: ['h', 'k', 'left', 'up'],
			description: 'HOTKEY.MOVE_UP',
			callback: moveUp
		});

		Hotkey.addHotkey({
			combo: ['j', 'l', 'right', 'down'],
			description: 'HOTKEY.MOVE_DOWN',
			callback: moveDown
		});

		Hotkey.addHotkey({
			combo: 'a',
			description: 'HOTKEY.ARCHIVE_EMAIL',
			callback: (event, key) => {
				event.preventDefault();
				//$scope.archive($scope.selectedTid);
			}
		});

		Hotkey.addHotkey({
			combo: 'd',
			description: 'HOTKEY.DELETE_EMAIL',
			callback: (event, key) => {
				event.preventDefault();
				$scope.deleteThread($scope.selectedTid);
			}
		});

		Hotkey.addHotkey({
			combo: 'r',
			description: 'HOTKEY.REPLY_EMAIL',
			callback: (event, key) => {
				event.preventDefault();
				$scope.replyThread(event, $scope.selectedTid);
			}
		});
	};

	addHotkeys();
};