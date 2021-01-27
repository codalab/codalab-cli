"""
This module exports some simple names used throughout the CodaLab bundle system:
  - The various CodaLab error classes, with documentation for each.
  - The State class, an enumeration of all legal bundle states.
  - precondition, a utility method that check's a function's input preconditions.
"""
import os
import http.client
import urllib.request
import urllib.error

from dataclasses import dataclass
from retry import retry
from enum import Enum
import logging

# Increment this on master when ready to cut a release.
# http://semver.org/
CODALAB_VERSION = '0.5.35'
BINARY_PLACEHOLDER = '<binary>'
URLOPEN_TIMEOUT_SECONDS = int(os.environ.get('CODALAB_URLOPEN_TIMEOUT_SECONDS', 5 * 60))

# Silence verbose HTTP output from Azure Blob
logger = logging.getLogger('azure.core.pipeline.policies.http_logging_policy')
logger.setLevel(logging.WARNING)


class IntegrityError(ValueError):
    """
    Raised by the model when there is a database integrity issue.

    Indicates a serious error that either means that there was a bug in the model
    code that left the database in a bad state, or that there was an out-of-band
    database edit with the same result.
    """


class PreconditionViolation(ValueError):
    """
    Raised when a value generated by one module fails to satisfy a precondition
    required by another module.

    This class of error is serious and should indicate a problem in code, but it
    it is not an AssertionError because it is not local to a single module.
    """


class UsageError(ValueError):
    """
    Raised when user input causes an exception. This error is the only one for
    which the command-line client suppresses output.
    """


class NotFoundError(UsageError):
    """
    Raised when a requested resource has not been found. Similar to HTTP status
    404.
    """


class AuthorizationError(UsageError):
    """
    Raised when access to a resource is refused because authentication is required
    and has not been provided. Similar to HTTP status 401.
    """


class PermissionError(UsageError):
    """
    Raised when access to a resource is refused because the user does not have
    necessary permissions. Similar to HTTP status 403.
    """


class LoginPermissionError(ValueError):
    """
    Raised when the login credentials are incorrect.
    """


# Listed in order of most specific to least specific.
http_codes_and_exceptions = [
    (http.client.FORBIDDEN, PermissionError),
    (http.client.UNAUTHORIZED, AuthorizationError),
    (http.client.NOT_FOUND, NotFoundError),
    (http.client.BAD_REQUEST, UsageError),
]


def exception_to_http_error(e):
    """
    Returns the appropriate HTTP error code and message for the given exception.
    """
    for known_code, exception_type in http_codes_and_exceptions:
        if isinstance(e, exception_type):
            return known_code, str(e)
    return http.client.INTERNAL_SERVER_ERROR, str(e)


def http_error_to_exception(code, message):
    """
    Returns the appropriate exception for the given HTTP error code and message.
    """
    for known_code, exception_type in http_codes_and_exceptions:
        if code == known_code:
            return exception_type(message)
    if code >= 400 and code < 500:
        return UsageError(message)
    return Exception(message)


def precondition(condition, message):
    if not condition:
        raise PreconditionViolation(message)


def ensure_str(response):
    """
    Ensure the data type of input response to be string
    :param response: a response in bytes or string
    :return: the input response in string
    """
    if isinstance(response, str):
        return response
    try:
        return response.decode()
    except UnicodeDecodeError:
        return BINARY_PLACEHOLDER


@retry(urllib.error.URLError, tries=2, delay=1, backoff=2)
def urlopen_with_retry(request: urllib.request.Request, timeout: int = URLOPEN_TIMEOUT_SECONDS):
    """
    Makes a request using urlopen with a timeout of URLOPEN_TIMEOUT_SECONDS seconds and retries on failures.
    Retries a maximum of 2 times, with an initial delay of 1 second and
    exponential backoff factor of 2 for subsequent failures (1s and 2s).
    :param request: Can be a url string or a Request object
    :param timeout: Timeout for urlopen in seconds
    :return: the response object
    """
    return urllib.request.urlopen(request, timeout=timeout)


class StorageType(Enum):
    FILE_STORAGE = 0
    AZURE_BLOB_STORAGE = 1


@dataclass(frozen=True)
class LinkedBundlePath:
    """A LinkedBundlePath refers to a path that points to the location of a linked bundle within a specific storage location.
    It can either point directly to the bundle, or to a file that is located within that bundle.
    It is constructed by parsing a given bundle link URL by calling parse_bundle_url().

    Attributes:
        storage_type (StorageType): Which storage type is used to store this bundle.

        bundle_path (str): Path to the bundle contents in that particular storage.

        is_zip (bool): Whether this bundle is stored as a zip file on this storage medium stores folders. Only done currently by Azure Blob Storage.

        uses_beam (bool): Whether this bundle's storage type requires using Apache Beam to interact with it.

        zip_subpath (str): If is_zip is True, returns the subpath within the zip file for the file that this BundlePath points to.

        bundle_uuid (str): UUID of the bundle that this path refers to.
    """

    storage_type: StorageType
    bundle_path: str
    is_zip: bool
    uses_beam: bool
    zip_subpath: str
    bundle_uuid: str


def parse_linked_bundle_url(url):
    """Parses a linked bundle URL. This bundle URL can refer to:
        - a single file: "azfs://storageclwsdev0/bundles/uuid/contents"
        - a single file that is stored within a zip file: "azfs://storageclwsdev0/bundles/uuid/contents.zip/file1"

        Returns a LinkedBundlePath instance to encode this information.
    """
    if url.startswith("azfs://"):
        uses_beam = True
        storage_type = StorageType.AZURE_BLOB_STORAGE
        url = url[len("azfs://") :]
        storage_account, container, bundle_uuid, contents_file, *remainder = url.split("/", 4)
        bundle_path = f"azfs://{storage_account}/{container}/{bundle_uuid}/{contents_file}"
        is_zip = contents_file.endswith(".zip")
        zip_subpath = remainder[0] if is_zip and len(remainder) else None
    else:
        storage_type = StorageType.FILE_STORAGE
        bundle_path = url
        is_zip = False
        uses_beam = False
        zip_subpath = None
        bundle_uuid = None
    return LinkedBundlePath(
        storage_type=storage_type,
        bundle_path=bundle_path,
        is_zip=is_zip,
        uses_beam=uses_beam,
        zip_subpath=zip_subpath,
        bundle_uuid=bundle_uuid,
    )
