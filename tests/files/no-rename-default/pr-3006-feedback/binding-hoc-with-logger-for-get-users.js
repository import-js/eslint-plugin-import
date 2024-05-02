import getUsers from '../default-fn-get-users';
import withLogger from './hoc-with-logger';

export default withLogger(getUsers);
