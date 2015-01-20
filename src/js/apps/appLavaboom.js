window.primaryApplicationName = 'AppLavaboom';
angular.module(primaryApplicationName, [
	'lavaboom.api',
	'ui.router',
	'ui.bootstrap',
	'ui.select',
	'pascalprecht.translate'
	]);

window.coJS = require('co');

var bulkRequire = require('bulk-require');

bulkRequire(__dirname, [
	'../runs/*.js',
	'../configs/*.js',
	'../directives/*.js',
	'../services/*.js',

	'./AppLavaboom/configs/*.js',
	'./AppLavaboom/directives/*.js',
	'./AppLavaboom/services/*.js',
	'./AppLavaboom/controllers/*.js'
]);