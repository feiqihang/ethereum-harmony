/**
 * Render home page.
 *  - show blockchain tree chart;
 *  - show blockchain info
 */

(function() {
    'use strict';

    /**
     * @example 1000 -> "1,000"
     */
    function numberWithCommas(x) {
        var arr = x.toString().split('.');
        var arr1 = arr[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return arr.length == 1 ? arr1 : arr1 + '.' + arr[1];
    }

    function hexToInt(hexValue) {
        return parseInt(remove0x(hexValue), 16);
    }

    function remove0x(value) {
        return (value && value.indexOf('0x') == 0) ? value.substr(2) : value;
    }


    function WalletCtrl($scope, $timeout, $stomp, $http, jsonrpc, $q, scrollConfig, ModalService) {
        $scope.scrollConfig = jQuery.extend(true, {}, scrollConfig);

        $scope.totalAmount = 0;
        $scope.totalAmountString = 0;
        $scope.totalAmountUSD = 'n/a';
        $scope.addresses = [];

        $scope.onSendClick = function(item) {
            console.log('onSendClick');
            ModalService.showModal({
                templateUrl:    "pages/popups/sendAmount.html",
                controller:     "SendAmountCtrl",
                inputs:         {item: item}
            }).then(function(modal) {
                modal.element.modal();
            });
        };

        $scope.onRemoveClick = function(item) {
            console.log('onRemoveClick');

            if (confirm("Delete address with its keystore file?")) {
                $stomp.send('/app/removeAddress', {
                    value:      item.publicAddress
                });
            }
        };

        $scope.onNewAddress = function() {
            console.log('onNewAddress');

            ModalService.showModal({
                templateUrl:    "pages/popups/newAddress.html",
                controller:     "NewAddressCtrl"
            }).then(function(modal) {
                modal.element.modal();
            });
        };

        $scope.onImportAddress = function() {
            console.log('onImportAddress');

            ModalService.showModal({
                templateUrl:    "pages/popups/importAddress.html",
                controller:     "ImportAddressCtrl"
            }).then(function(modal) {
                modal.element.modal();
            });
        };

        function resizeContainer() {
            console.log('Wallet page resize');

            var scrollContainer = document.getElementById("address-scroll-container");
            var rect = scrollContainer.getBoundingClientRect();
            var newHeight = $(window).height() - rect.top - 30;
            //$(scrollContainer).css('maxHeight', newHeight + 'px');
            $timeout(function() {
                $scope.scrollConfig.setHeight = newHeight;
                $(scrollContainer).mCustomScrollbar($scope.scrollConfig);
            }, 10);
        }

        $scope.$on('walletInfoEvent', function(event, data) {
            console.log('walletInfoEvent');
            console.log(data);

            $timeout(function() {
                var ethRate = Math.pow(10, 18);
                var cutTo = Math.pow(10, 7);
                var convertToEth = function(value) { return new BigNumber('' + value).dividedBy(ethRate / cutTo).floor().dividedBy(cutTo); }

                $scope.totalAmount = convertToEth(data.totalAmount).toNumber();
                $scope.totalAmountString = numberWithCommas($scope.totalAmount);

                data.addresses.forEach(function(a) {
                    console.log(a);
                    a.publicAddress = EthUtil.toChecksumAddress(a.publicAddress);

                    var amount = convertToEth(a.amount);
                    var pendingAmount = convertToEth(a.pendingAmount);

                    a.amount = amount.toNumber();
                    a.amountString = numberWithCommas(a.amount);
                    if (!amount.equals(pendingAmount)) {
                        a.pendingAmountString = '(' + numberWithCommas(pendingAmount.toNumber()) + ')';
                    } else {
                        a.pendingAmountString = '';
                    }
                });
                $scope.addresses = data.addresses;
            }, 10);

            $http({
                method: 'GET',
                url: 'https://coinmarketcap-nexuist.rhcloud.com/api/eth'
            }).then(function(result) {
                try {
                    var price = result.data.price.usd;
                    $scope.totalAmountUSD = numberWithCommas($scope.totalAmount * price);
                } catch (e) {
                    // silent
                    console.log('Problem loading market value of ETH. ' + e)
                }
            })
        });


        $(window).ready(function() {
            // Every time a modal is shown, if it has an autofocus element, focus on it.
            //$('.modal').on('shown.bs.modal', function() {
            //    $(this).find('[autofocus]').focus();
            //});

            resizeContainer();
        });
        $scope.$on('windowResizeEvent', resizeContainer);
    }

    angular.module('HarmonyApp')
        .controller('WalletCtrl', ['$scope', '$timeout', '$stomp', '$http', 'jsonrpc', '$q', 'scrollConfig', 'ModalService', WalletCtrl])

})();