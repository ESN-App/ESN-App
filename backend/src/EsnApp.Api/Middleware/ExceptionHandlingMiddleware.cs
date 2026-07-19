using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Middleware;

public class ExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (ValidationException exception)
        {
            var problem = new ValidationProblemDetails(
                exception.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray()))
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation failed",
            };

            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsJsonAsync(problem);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unhandled exception for {Method} {Path}",
                context.Request.Method, context.Request.Path);

            var problem = new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "An unexpected error occurred.",
            };

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(problem);
        }
    }
}
