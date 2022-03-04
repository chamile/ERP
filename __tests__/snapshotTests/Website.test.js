import React from 'react';
import Website from '../../app/components/Website';
import 'react-native/Libraries/Animated/src/bezier'
import renderer from 'react-test-renderer';

it('Website component renders correctly', done => {
    const tree = renderer.create(
        <Website />
    ).toJSON();
    expect(tree).toMatchSnapshot();
    done();
});
