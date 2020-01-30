/*
 *  Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import {
    VictoryChart, VictoryArea, VictoryAxis,
} from 'victory';
import Paper from '@material-ui/core/Paper';
import { FormattedMessage } from 'react-intl';

/**
 * Display the Error details catogarizet by time
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render error Detail chart
 */
export default function errorDetailChart(props) {
    const { errorData } = props;
    const styles = {
        input: {
            display: 'none',
        },
        paper: {
            background: '#040b4b',
            width: '75%',
            padding: '4%',
            margin: 'auto',
            paddingTop: '150px',
        },
        headingWrapper: {
            height: '5%',
            margin: 'auto',
            paddingTop: '10px',
            width: '90%',
        },
        h3: {
            borderBottom: '1.5px solid #fff',
            paddingBottom: '7px',
            paddingTop: '7px',
            margin: 'auto',
            textAlign: 'center',
            fontWeight: 'normal',
            letterSpacing: 1.5,
            width: '80%',
        },
        maindiv: {
            maxWidth: '100%',
            maxHeight: '420px',
            minWidth: '50%',
            minHeight: '420px',
            marginRight: '2px',
            backgroundColor: '#040b4b',
            marginTop: '5px',
        },
        victry: {
            axisLabel: {
                padding: 30,
                fill: '#ffffff',
                fontSize: '8px',
            },
        },
    };
    const chartTheme = {
        axis: {
            style: {
                tickLabels: {
                    fill: 'white',
                    fontSize: '8px',
                    angle: 25,
                },
            },
        },
    };

    if (errorData === null || errorData.length === 0) {
        return (
            <div style={styles.maindiv}>
                <div style={styles.headingWrapper}>
                    <h3 style={styles.h3}>
                        <FormattedMessage
                            id='errorCount.heading'
                            defaultMessage='ERROR COUNT'
                        />
                    </h3>
                </div>
                <Paper
                    elevation={1}
                    style={styles.paper}
                >
                    <Typography
                        variant='h5'
                        component='h3'
                    >
                        <FormattedMessage
                            id='nodata.error.heading'
                            defaultMessage='No Data Available !'
                        />
                    </Typography>
                    <Typography component='p'>
                        <FormattedMessage
                            id='nodata.error.body'
                            defaultMessage='No data available for the selected options!.'
                        />
                    </Typography>
                </Paper>
            </div>
        );
    } else {
        return (
            <div style={styles.maindiv}>
                <div style={styles.headingWrapper}>
                    <h3 style={styles.h3}>
                        <FormattedMessage
                            id='errorCount.heading'
                            defaultMessage='ERROR COUNT'
                        />
                    </h3>
                </div>
                <svg viewBox='-50 1 500 200'>
                    <h6>Traffic Vs Time</h6>
                    <VictoryChart
                        theme={chartTheme}
                        standalone={false}
                        width={400}
                        height={200}
                    >
                        <VictoryArea
                            animate={{
                                duration: 2000,
                                onLoad: { duration: 1000 },
                            }}
                            style={{ data: { fill: '#0e0e24' } }}
                            data={errorData}
                        />
                        <VictoryAxis
                            label='Time'
                            style={styles.victry}
                        />
                        <VictoryAxis
                            dependentAxis
                            label='Api Error Count'
                            style={styles.victry}
                        />
                    </VictoryChart>
                </svg>
            </div>
        );
    }
}

errorDetailChart.propTypes = {
    errorData: PropTypes.instanceOf(Object).isRequired,
};
