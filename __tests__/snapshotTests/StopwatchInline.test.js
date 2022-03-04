import React from 'react';
import StopwatchInline from '../../app/components/StopwatchInline';

import renderer from 'react-test-renderer';

it('StopwatchInline component renders correctly', (done) => {
    const tree = renderer.create(
        <StopwatchInline />
    ).toJSON();
    expect(tree).toMatchSnapshot();
    done();
});
