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
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Widget from '@wso2-dashboards/widget';
import APIMOverallApiStats from './APIMOverallApiStats';

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
 * Language
 * @type {string}
 */
const language = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;

/**
 * Language without region code
 */
const languageWithoutRegionCode = language.toLowerCase().split(/[_-]+/)[0];

/**
 * Create React Component for APIM Overall Api Stats
 * @class APIMOverallApiStatsWidget
 * @extends {Widget}
 */
class APIMOverallApiStatsWidget extends Widget {
    /**
     * Creates an instance of APIMOverallApiStatsWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMOverallApiStatsWidget
     */
    constructor(props) {
        super(props);

        this.state = {
            width: this.props.width,
            height: this.props.height,
            availableApiData: null,
            legendData: [],
            topApiIdData: [],
            topApiNameData: [],
            apiProviderList: [],
            localeMessages: null,
            loadingTopApis: true,
        };

        this.styles = {
            paper: {
                padding: '5%',
                border: '2px solid #4555BB',
            },
            paperWrapper: {
                margin: 'auto',
                width: '50%',
                marginTop: '20%',
            },
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.assembleApiAvailableQuery = this.assembleApiAvailableQuery.bind(this);
        this.assembleAPIDataQuery = this.assembleAPIDataQuery.bind(this);
        this.assembleTopAPIQuery = this.assembleTopAPIQuery.bind(this);
        this.handleApiAvailableReceived = this.handleApiAvailableReceived.bind(this);
        this.handleAPIDataReceived = this.handleAPIDataReceived.bind(this);
        this.handleTopAPIReceived = this.handleTopAPIReceived.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
        this.assembleAPIListQuery = this.assembleAPIListQuery.bind(this);
        this.handleAPIListReceived = this.handleAPIListReceived.bind(this);
    }

    componentDidMount() {
        const { widgetID } = this.props;
        const locale = languageWithoutRegionCode || language;
        this.loadLocale(locale);

        super.getWidgetConfiguration(widgetID)
            .then((message) => {
                this.setState({
                    providerConfig: message.data.configs.providerConfig,
                }, this.assembleApiAvailableQuery);
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
     * @memberof APIMOverallApiStatsWidget
     */
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMOverallApiStats/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    /**
     * Formats the siddhi query - apiavailablequery
     * @memberof APIMOverallApiStatsWidget
     * */
    assembleApiAvailableQuery() {
        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'apiavailablequery';
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleApiAvailableReceived, dataProviderConfigs);
    }

    /**
     * Formats data received from assembleApiAvailableQuery
     * @param {object} message - data retrieved
     * @memberof APIMOverallApiStatsWidget
     * */
    handleApiAvailableReceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data) {
            const legendData = [];
            data.forEach((dataUnit) => {
                if (!legendData.includes({ name: dataUnit[0] })) {
                    legendData.push({ name: dataUnit[0] });
                }
            });
            this.setState({ legendData, availableApiData: data });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleAPIListQuery();
    }

    /**
     * Formats the siddhi query - topapiquery
     * @memberof APIMOverallApiStatsWidget
     * */
    assembleTopAPIQuery() {
        const { providerConfig, apiIdMap } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (apiIdMap) {
            let apiIds = Object.keys(apiIdMap).map(id => { return 'API_ID==' + id });
            apiIds = apiIds.join(' OR ');
            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'topapiquery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{apiList}}': apiIds
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id, widgetName, this.handleTopAPIReceived, dataProviderConfigs);
        }
    }

    /**
     * Formats data received from assembleTopAPIQuery
     * @param {object} message - data retrieved
     * @memberof APIMOverallApiStatsWidget
     * */
    handleTopAPIReceived(message) {
        const { data } = message;

        if (data) {
            const { apiIdMap } = this.state;
            const topApiNameData = data.map(dataUnit => {
                const api = apiIdMap[dataUnit[0]];
                return {
                    apiname: api[1] + ' (' + api[3] + ')',
                    ratings: dataUnit[1],
                };
            });
            this.setState({ topApiNameData, loadingTopApis: false });
        }
    }

    /**
     * Get API list from publisher
     * @memberof APIMOverallApiStatsWidget
     * */
    assembleAPIListQuery() {
        Axios.get(`${window.contextPath}/apis/analytics/v1.0/apim/apis`)
            .then((response) => {
                this.handleAPIListReceived(response.data);
            })
            .catch(error => console.error(error));
    }

    /**
     * Formats data received from assembleAPIDataQuery
     * @param {object} data - data retrieved
     * @memberof APIMOverallApiStatsWidget
     * */
    handleAPIListReceived(data) {
        const { list } = data;
        const { id } = this.props;
        if (list) {
            const apiProviderList = list.map (dataUnit =>
                { return [dataUnit.name, dataUnit.provider]; }
            );
            this.setState({ apiProviderList });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleAPIDataQuery()
    }

    /**
     * Formats the siddhi query - apilistquery
     * @memberof APIMOverallApiStatsWidget
     * */
    assembleAPIDataQuery() {
        const { providerConfig, apiProviderList } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (apiProviderList) {
            let apiCondition = apiProviderList.map(data => {
                return '(API_NAME==\'' + data[0] + '\' AND API_PROVIDER==\''+ data[1] + '\')';
            });
            apiCondition = apiCondition.join(' OR ');

            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'apilistquery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{apiCondition}}': apiCondition
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id, widgetName, this.handleAPIDataReceived, dataProviderConfigs);
        }
    }

    /**
     * Formats data received from assembleAPIDataQuery
     * @param {object} message - data retrieved
     * @memberof APIMOverallApiStatsWidget
     * */
    handleAPIDataReceived(message) {
        const { data } = message;
        const { id } = this.props;
        if (data) {
            const apiIdMap = {};
            data.map(api => { apiIdMap[api[0]]= api; });
            this.setState({ apiIdMap });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleTopAPIQuery()
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Overall Api Stats widget
     * @memberof APIMOverallApiStatsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, availableApiData, legendData, topApiNameData, loadingTopApis,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const overallStatsProps = {
            themeName, height, availableApiData, legendData, topApiNameData, loadingTopApis,
        };

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
                                            defaultMessage={'Cannot fetch provider configuration for APIM '
                                            + 'Overall Api Stats widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                    ) : (
                        <APIMOverallApiStats {...overallStatsProps} />
                    )
                }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMOverallApiStats', APIMOverallApiStatsWidget);
