import React from 'react';
import InputFieldWithValidation from '../../app/components/InputFieldWithValidation';

import renderer from 'react-test-renderer';

it('InputFieldWithValidation component renders correctly', (done) => {
    const tree = renderer.create(
        <InputFieldWithValidation />
    ).toJSON();
    expect(tree).toMatchSnapshot();
    done();
});
