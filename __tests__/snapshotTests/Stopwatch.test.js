import React from 'react';
import Stopwatch from '../../app/components/Stopwatch';

import renderer from 'react-test-renderer';

it('Stopwatch component renders correctly', (done) => {
    const tree = renderer.create(
        <Stopwatch />
    ).toJSON();
    expect(tree).toMatchSnapshot();
    done();
});
