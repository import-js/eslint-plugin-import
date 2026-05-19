import getUsers from '../default-fn-get-users';
import withAuth from './hoc-with-auth';
import withLogger from './hoc-with-logger';

export default withLogger(withAuth(getUsers));
