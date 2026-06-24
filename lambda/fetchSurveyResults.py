"""
fetchSurveyResults Lambda (rewritten for V2 raw answers).

Reads the ChallengeSurveyResponses table and returns raw survey answers for a
given surveyId. Querys the `surveyId-submittedAt-index` GSI (partition surveyId,
sort submittedAt) instead of scanning the whole table.

Deploy: this is the standalone Lambda behind API Gateway `pl5xaf0r80`
(GET https://pl5xaf0r80.execute-api.us-east-1.amazonaws.com/prod/fetchSurveyResults).
This file is kept in the dashboard repo for reference/version control.

Env vars:
  TABLE_NAME        default "ChallengeSurveyResponses"
  INDEX_NAME        default "surveyId-submittedAt-index"
  ALLOWED_ORIGIN    default "https://hapjoy-technologies.github.io"
  DEFAULT_PAGE_SIZE default 200
  MAX_PAGE_SIZE     default 1000

IAM: execution role needs dynamodb:Query on the table AND its index
  arn:aws:dynamodb:us-east-1:<acct>:table/ChallengeSurveyResponses
  arn:aws:dynamodb:us-east-1:<acct>:table/ChallengeSurveyResponses/index/*
"""

import os
import json
import base64
import boto3
from decimal import Decimal
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr

dynamodb = boto3.resource("dynamodb")
TABLE_NAME = os.environ.get("TABLE_NAME", "ChallengeSurveyResponses")
INDEX_NAME = os.environ.get("INDEX_NAME", "surveyId-submittedAt-index")
table = dynamodb.Table(TABLE_NAME)

ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "https://hapjoy-technologies.github.io")
CORS_HEADERS = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
}
DEFAULT_PAGE_SIZE = int(os.environ.get("DEFAULT_PAGE_SIZE", "200"))
MAX_PAGE_SIZE = int(os.environ.get("MAX_PAGE_SIZE", "1000"))


def decimal_default(o):
    if isinstance(o, Decimal):
        return int(o) if o % 1 == 0 else float(o)
    raise TypeError(f"Object of type {type(o).__name__} is not JSON serializable")


def _response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, default=decimal_default),
    }


def _parse_int(value, default=None):
    try:
        return int(value)
    except Exception:
        return default


def _decode_cursor(cursor):
    try:
        raw = base64.urlsafe_b64decode(cursor.encode("utf-8")).decode("utf-8")
        return json.loads(raw)
    except Exception:
        return None


def _encode_cursor(lek):
    raw = json.dumps(lek, default=decimal_default).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8")


def lambda_handler(event, context):
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}
    if event.get("httpMethod") != "GET":
        return _response(405, {"message": "Method not allowed"})

    try:
        params = event.get("queryStringParameters") or {}
        survey_id = params.get("surveyId")
        if not survey_id:
            return _response(400, {"message": "surveyId is required"})

        challenge_id = params.get("challengeId")
        user_id = params.get("userId")
        day_num = _parse_int(params.get("dayNum"))

        limit = _parse_int(params.get("limit"), DEFAULT_PAGE_SIZE) or DEFAULT_PAGE_SIZE
        limit = max(1, min(limit, MAX_PAGE_SIZE))

        cursor = params.get("cursor")
        exclusive_start_key = _decode_cursor(cursor) if cursor else None

        # Optional filters applied on top of the survey partition.
        filter_expr = None
        if challenge_id:
            filter_expr = Attr("challengeId").eq(challenge_id)
        if user_id:
            cond = Attr("userId").eq(user_id)
            filter_expr = cond if filter_expr is None else filter_expr & cond
        if day_num is not None:
            cond = Attr("dayNum").eq(day_num)
            filter_expr = cond if filter_expr is None else filter_expr & cond

        query_kwargs = {
            "IndexName": INDEX_NAME,
            "KeyConditionExpression": Key("surveyId").eq(survey_id),
            "Limit": limit,
            "ScanIndexForward": True,  # chronological by submittedAt
        }
        if filter_expr is not None:
            query_kwargs["FilterExpression"] = filter_expr
        if exclusive_start_key:
            query_kwargs["ExclusiveStartKey"] = exclusive_start_key

        resp = table.query(**query_kwargs)
        items = resp.get("Items", [])
        lek = resp.get("LastEvaluatedKey")

        results = [
            {
                "userId": it.get("userId"),
                "challengeId": it.get("challengeId"),
                "surveyId": it.get("surveyId"),
                "dayNum": it.get("dayNum"),
                "surveyType": it.get("surveyType"),
                "submittedAt": it.get("submittedAt"),
                "answers": it.get("answers", []),
            }
            for it in items
        ]

        return _response(
            200,
            {
                "results": results,
                "count": len(results),
                "nextCursor": _encode_cursor(lek) if lek else None,
            },
        )

    except ClientError as e:
        return _response(500, {"message": "DynamoDB error", "error": str(e)})
    except Exception as e:
        return _response(500, {"message": "Unexpected error", "error": str(e)})
