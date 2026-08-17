export const errorHandler = (err, req, res, next) => {
  console.error('[CRM Service Error]:', err);

  // PostgreSQL duplicate key violation
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Conflict Error',
      message: 'A record with this unique value already exists.',
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Foreign Key Violation',
      message: 'The referenced record does not exist.',
    });
  }

  // PostgreSQL invalid text representation (e.g. bad UUID or enum)
  if (err.code === '22P02') {
    return res.status(400).json({
      error: 'Invalid Input',
      message: 'The provided data format is invalid.',
    });
  }

  // Fallback generic error
  import('fs').then(fs => fs.writeFileSync('global_error.log', err.stack || err.message)).catch(() => {});
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong processing your request.',
  });
};
