using FluentValidation;

namespace EsnApp.Application.Events.GetAdminEvents;

public class GetAdminEventsQueryValidator : AbstractValidator<GetAdminEventsQuery>
{
    public GetAdminEventsQueryValidator()
    {
        RuleFor(query => query.Status).IsInEnum()
            .When(query => query.Status.HasValue);
        RuleFor(query => query.To)
            .GreaterThan(query => query.From)
            .When(query => query.From.HasValue && query.To.HasValue);
        RuleFor(query => query.Page).GreaterThanOrEqualTo(1);
        RuleFor(query => query.PageSize).InclusiveBetween(1, 100);
    }
}
