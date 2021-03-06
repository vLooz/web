module.exports = /*@ngInject*/($rootScope, $scope, $interval, $translate, $timeout, translate, user, hotkey) => {
	$scope.form = {
		selectedLanguage: null,
		contactsSortBy: null
	};
	$scope.languages = [];
    $scope.settings = {};

    $rootScope.hotkeys = [];

    $scope.$bind('user-settings', () => {
        $scope.settings = user.settings;
    });

	const translations = {};

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_NOT_IMPLEMENTED = $translate.instant('GLOBAL.LB_NOT_IMPLEMENTED');
		translations.LB_SORT_BY_DISPLAY_NAME = $translate.instant('MAIN.SETTINGS.GENERAL.LB_SORT_BY_DISPLAY_NAME');
		translations.LB_SORT_BY_FIRST_NAME = $translate.instant('MAIN.SETTINGS.GENERAL.LB_SORT_BY_FIRST_NAME');
		translations.LB_SORT_BY_LAST_NAME = $translate.instant('MAIN.SETTINGS.GENERAL.LB_SORT_BY_LAST_NAME');

		$scope.notImplemented = [{name: translations.LB_NOT_IMPLEMENTED}];
		$scope.sortBy = [
			{name: translations.LB_SORT_BY_DISPLAY_NAME},
			{name: translations.LB_SORT_BY_FIRST_NAME},
			{name: translations.LB_SORT_BY_LAST_NAME}
		];

		if (!$scope.form.contactsSortBy)
			$scope.form.contactsSortBy = $scope.sortBy[user.settings.contactsSortBy ? user.settings.contactsSortBy : 0];
	});

	$scope.languages = Object.keys(translate.settings.TRANSLATIONS).reduce((a, langCode) => {
		a.push({
			name: translate.settings.TRANSLATIONS[langCode],
			langCode: langCode
		});
		return a;
	}, []);
	$scope.form.selectedLanguage = $scope.languages.find(e => e.langCode == translate.getCurrentLangCode());

	console.log('initialize CtrlSettingsGeneral', $scope.languages);

	$scope.$watch('form.selectedLanguage', () => {
		if ($scope.form.selectedLanguage)
			translate.switchLanguage($scope.form.selectedLanguage.langCode);
	});

	$scope.$watch('form.contactsSortBy', () => {
		if ($scope.form.contactsSortBy)
			user.update({contactsSortBy: $scope.sortBy.findIndex(e => e.name == $scope.form.contactsSortBy.name)});
	});

    $scope.$watch('settings.isHotkeyEnabled', () => {
        hotkey.toggleHotkeys($scope.settings.isHotkeyEnabled);
    });

	const timeouts = {
		clear: null,
		update: null
	};

    $scope.$watch('status', () => {
        if ($scope.status) {
			timeouts.clear = $timeout.schedule(timeouts.clear, () => {
                $scope.status = '';
            }, 1000);
        }
    });

    $scope.$watch('settings', (o, n) => {
        if (o === n) return;

        if (Object.keys($scope.settings).length > 0) {
			timeouts.update = $timeout.schedule(timeouts.update, () => {
                user.update($scope.settings)
                .then(() => {
                    $scope.status = 'saved!';
                })
                .catch(() => {
                    $scope.status = 'ops...';
                });
            }, 1000);
        }
    }, true);

};