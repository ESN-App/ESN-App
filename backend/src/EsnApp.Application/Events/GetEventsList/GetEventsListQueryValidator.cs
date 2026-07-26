using FluentValidation;

namespace EsnApp.Application.Events.GetEventsList;

public class GetEventsListQueryValidator : AbstractValidator<GetEventsListQuery>
{
    public GetEventsListQueryValidator()
    {
        RuleFor(query => query.To).GreaterThan(query => query.From);
        RuleFor(query => query.Page).GreaterThanOrEqualTo(1);
        RuleFor(query => query.PageSize).InclusiveBetween(1, 100);
    }
}
