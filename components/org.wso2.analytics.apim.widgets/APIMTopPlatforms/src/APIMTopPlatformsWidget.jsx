/*
 *  Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 */

import React from 'react';
import {
    defineMessages, IntlProvider, FormattedMessage,
} from 'react-intl';
import Axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Widget from '@wso2-dashboards/widget';
import APIMTopPlatforms from './APIMTopPlatforms';

const darkTheme = createMuiTheme({
    palette: {
        type: 'dark',
    },
    typography: {
        useNextVariants: true,
    },
});

const lightTheme = createMuiTheme({
    palette: {
        type: 'light',
    },
    typography: {
        useNextVariants: true,
    },
});

/**
 * Query string parameter values
 * @type {object}
 */
const createdByKeys = {
    All: 'All',
    Me: 'Me',
};

/**
 * Query string parameter
 * @type {string}
 */
const queryParamKey = 'platforms';

/**
 * Language
 * @type {string}
 */
const language = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;

/**
 * Language without region code
 */
const languageWithoutRegionCode = language.toLowerCase().split(/[_-]+/)[0];

/**
 * Create React Component for APIM Top Platforms widget
 * @class APIMTopPlatformsWidget
 * @extends {Widget}
 */
class APIMTopPlatformsWidget extends Widget {
    /**
     * Creates an instance of APIMTopPlatformsWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMTopPlatformsWidget
     */
    constructor(props) {
        super(props);
        this.styles = {
            loadingIcon: {
                margin: 'auto',
                display: 'block',
            },
            paper: {
                padding: '5%',
                border: '2px solid #4555BB',
            },
            paperWrapper: {
                margin: 'auto',
                width: '50%',
                marginTop: '20%',
            },
            inProgress: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: this.props.height,
            },
        };

        this.state = {
            width: this.props.width,
            height: this.props.height,
            limit: 0,
            apiCreatedBy: 'All',
            apiSelected: 'All',
            apiVersion: 'All',
            versionlist: null,
            apilist: null,
            legendData: null,
            platformData: null,
            localeMessages: null,
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.handleApiListReceived = this.handleApiListReceived.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.apiCreatedHandleChange = this.apiCreatedHandleChange.bind(this);
        this.apiSelectedHandleChange = this.apiSelectedHandleChange.bind(this);
        this.apiVersionHandleChange = this.apiVersionHandleChange.bind(this);
        this.handleLimitChange = this.handleLimitChange.bind(this);
        this.assembleApiListQuery = this.assembleApiListQuery.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
    }

    componentDidMount() {
        const { widgetID } = this.props;
        const locale = languageWithoutRegionCode || language;
        this.loadLocale(locale);

        super.getWidgetConfiguration(widgetID)
            .then((message) => {
                this.setState({
                    providerConfig: message.data.configs.providerConfig,
                }, () => super.subscribe(this.handlePublisherParameters));
            })
            .catch((error) => {
                console.error("Error occurred when loading widget '" + widgetID + "'. " + error);
                this.setState({
                    faultyProviderConfig: true,
                });
            });
    }

    componentWillUnmount() {
        const { id } = this.props;
        super.getWidgetChannelManager().unsubscribeWidget(id);
    }

    /**
     * Load locale file.
     * @param {string} locale Locale name
     * @memberof APIMTopPlatformsWidget
     */
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMTopPlatforms/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    /**
     * Retrieve params from publisher - DateTimeRange
     * @memberof APIMTopPlatformsWidget
     * */
    handlePublisherParameters(receivedMsg) {
        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            perValue: receivedMsg.granularity,
        }, this.assembleApiListQuery);
    }

    /**
     * Reset the state according to queryParam
     * @memberof APIMTopPlatformsWidget
     * */
    resetState() {
        const queryParam = super.getGlobalState(queryParamKey);
        let { apiCreatedBy } = queryParam;
        let { apiSelected } = queryParam;
        let { apiVersion } = queryParam;
        let { limit } = queryParam;
        if (!apiCreatedBy) {
            apiCreatedBy = 'All';
        }
        if (!apiSelected) {
            apiSelected = 'All';
        }
        if (!apiVersion) {
            apiVersion = 'All';
        }
        if (!limit) {
            limit = 5;
        }
        this.setState({
            apiCreatedBy, apiSelected, apiVersion, limit,
        });
        this.setQueryParam(apiCreatedBy, apiSelected, apiVersion, limit);
    }

    /**
     * Formats the siddhi query - apilistquery
     * @memberof APIMTopPlatformsWidget
     * */
    assembleApiListQuery() {
        this.resetState();
        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'apilistquery';
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleApiListReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleApiListQuery
     * @param {object} message - data retrieved
     * @memberof APIMTopPlatformsWidget
     * */
    handleApiListReceived(message) {
        const { data } = message;
        const {
            apiCreatedBy, apiSelected, apiVersion, limit,
        } = this.state;
        const { id } = this.props;
        const currentUser = super.getCurrentUser();

        if (data) {
            const apilist = ['All'];
            const versionlist = ['All'];

            if (apiCreatedBy === createdByKeys.All) {
                data.forEach((dataUnit) => {
                    if (!apilist.includes(dataUnit[0])) {
                        apilist.push(dataUnit[0]);
                    }
                    if (apiSelected === dataUnit[0]) {
                        versionlist.push(dataUnit[1]);
                    }
                });
            } else if (apiCreatedBy === createdByKeys.Me) {
                data.forEach((dataUnit) => {
                    if (currentUser.username === dataUnit[2]) {
                        if (!apilist.includes(dataUnit[0])) {
                            apilist.push(dataUnit[0]);
                        }
                        if (apiSelected === dataUnit[0]) {
                            versionlist.push(dataUnit[1]);
                        }
                    }
                });
            }
            this.setState({ apilist, versionlist });
            this.setQueryParam(apiCreatedBy, apiSelected, apiVersion, limit);
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleMainQuery();
    }

    /**
     * Formats the siddhi query - mainquery
     * @memberof APIMTopPlatformsWidget
     * */
    assembleMainQuery() {
        this.resetState();
        const {
            timeFrom, timeTo, perValue, providerConfig, apilist,
        } = this.state;
        const queryParam = super.getGlobalState(queryParamKey);
        const { apiSelected, apiVersion, limit } = queryParam;
        const { id, widgetID: widgetName } = this.props;

        const apilistSliced = apilist.slice(1);
        const last = apilist.slice(-1)[0];
        let text = "apiName=='";
        apilistSliced.forEach((api) => {
            if (api !== last) {
                text += api + "' or apiName=='";
            } else {
                text += api + "' ";
            }
        });

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'mainquery';
        if (apiSelected === 'All' && apiVersion === 'All') {
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{timeFrom}}': timeFrom,
                '{{timeTo}}': timeTo,
                '{{per}}': perValue,
                '{{limit}}': limit,
                '{{querystring}}': 'on (' + text + ')'
            };
        } else if (apiSelected !== 'All' && apiVersion !== 'All') {
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{timeFrom}}': timeFrom,
                '{{timeTo}}': timeTo,
                '{{per}}': perValue,
                '{{limit}}': limit,
                '{{querystring}}': "on apiName=='{{api}}' AND apiVersion=='{{version}}'",
                '{{api}}': apiSelected,
                '{{version}}': apiVersion
            };
        } else {
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{timeFrom}}': timeFrom,
                '{{timeTo}}': timeTo,
                '{{per}}': perValue,
                '{{limit}}': limit,
                '{{querystring}}': "on apiName=='{{api}}'",
                '{{api}}': apiSelected
            };
        }
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleDataReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleMainQuery
     * @param {object} message - data retrieved
     * @memberof APIMTopPlatformsWidget
     * */
    handleDataReceived(message) {
        const { data } = message;
        const {
            apiCreatedBy, apiSelected, apiVersion, limit,
        } = this.state;

        if (data) {
            const platformData = [];
            const legendData = [];
            let counter = 0;
            data.forEach((dataUnit) => {
                counter += 1;
                if (!legendData.includes({ name: dataUnit[0] })) {
                    legendData.push({ name: dataUnit[0] });
                }
                platformData.push({ id: counter, platform: dataUnit[0], reqCount: dataUnit[1] });
            });

            this.setState({ legendData, platformData });
            this.setQueryParam(apiCreatedBy, apiSelected, apiVersion, limit);
        }
    }

    /**
     * Updates query param values
     * @param {string} apiCreatedBy - API Created By menu option selected
     * @param {string} apiSelected - API Name menu option selected
     * @param {string} apiVersion - API Version menu option selected
     * @param {number} limit - data limitation value
     * @memberof APIMTopPlatformsWidget
     * */
    setQueryParam(apiCreatedBy, apiSelected, apiVersion, limit) {
        super.setGlobalState(queryParamKey, {
            apiCreatedBy,
            apiSelected,
            apiVersion,
            limit,
        });
    }

    /**
     * Handle Limit select Change
     * @param {Event} event - listened event
     * @memberof APIMTopPlatformsWidget
     * */
    handleLimitChange(event) {
        const { apiCreatedBy, apiSelected, apiVersion } = this.state;
        const { id } = this.props;

        this.setQueryParam(apiCreatedBy, apiSelected, apiVersion, event.target.value);
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleMainQuery();
    }

    /**
     * Handle API Created By menu select change
     * @param {Event} event - listened event
     * @memberof APIMTopPlatformsWidget
     * */
    apiCreatedHandleChange(event) {
        const { limit } = this.state;
        const { id } = this.props;

        this.setQueryParam(event.target.value, 'All', 'All', limit);
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiListQuery();
    }

    /**
     * Handle API name menu select change
     * @param {Event} event - listened event
     * @memberof APIMTopPlatformsWidget
     * */
    apiSelectedHandleChange(event) {
        const { apiCreatedBy, limit } = this.state;
        const { id } = this.props;

        this.setQueryParam(apiCreatedBy, event.target.value, 'All', limit);
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiListQuery();
    }

    /**
     * Handle API Version menu select change
     * @param {Event} event - listened event
     * @memberof APIMTopPlatformsWidget
     * */
    apiVersionHandleChange(event) {
        const { apiCreatedBy, apiSelected, limit } = this.state;
        const { id } = this.props;

        this.setQueryParam(apiCreatedBy, apiSelected, event.target.value, limit);
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleMainQuery();
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Top Platforms widget
     * @memberof APIMTopPlatformsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, limit, apiCreatedBy, apiSelected, apiVersion,
            legendData, platformData, apilist, versionlist,
        } = this.state;
        const {
            loadingIcon, paper, paperWrapper, inProgress,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const platformsProps = {
            themeName,
            height,
            limit,
            apiCreatedBy,
            apiSelected,
            apiVersion,
            legendData,
            platformData,
            apilist,
            versionlist,
        };

        if (!localeMessages || !platformData) {
            return (
                <div style={inProgress}>
                    <CircularProgress style={loadingIcon} />
                </div>
            );
        }
        return (
            <IntlProvider locale={languageWithoutRegionCode} messages={localeMessages}>
                <MuiThemeProvider theme={themeName === 'dark' ? darkTheme : lightTheme}>
                    {
                        faultyProviderConfig ? (
                            <div style={paperWrapper}>
                                <Paper elevation={1} style={paper}>
                                    <Typography variant='h5' component='h3'>
                                        <FormattedMessage
                                            id='config.error.heading'
                                            defaultMessage='Configuration Error !'
                                        />
                                    </Typography>
                                    <Typography component='p'>
                                        <FormattedMessage
                                            id='config.error.body'
                                            defaultMessage={'Cannot fetch provider configuration for APIM'
                                            + ' Top Platforms widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMTopPlatforms
                                {...platformsProps}
                                apiCreatedHandleChange={this.apiCreatedHandleChange}
                                apiSelectedHandleChange={this.apiSelectedHandleChange}
                                apiVersionHandleChange={this.apiVersionHandleChange}
                                handleLimitChange={this.handleLimitChange}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMTopPlatforms', APIMTopPlatformsWidget);
