using FluentValidation;

namespace EsnApp.Application.Events.GetAdminEvents;

public class GetAdminEventsQueryValidator : AbstractValidator<GetAdminEventsQuery>
{
    public GetAdminEventsQueryValidator()
    {
        RuleFor(query => query.Page).GreaterThanOrEqualTo(1);
        RuleFor(query => query.PageSize).InclusiveBetween(1, 100);
    }
}
