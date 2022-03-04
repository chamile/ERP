import React from 'react';
import FloatingBottomContainer from '../../app/components/FloatingBottomContainer';

import renderer from 'react-test-renderer';

it('FloatingBottomContainer component renders correctly', (done) => {
    const tree = renderer.create(
        <FloatingBottomContainer />
    ).toJSON();
    expect(tree).toMatchSnapshot();
    done();
});
