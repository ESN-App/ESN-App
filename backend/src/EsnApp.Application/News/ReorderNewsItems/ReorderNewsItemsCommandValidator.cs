using FluentValidation;

namespace EsnApp.Application.News.ReorderNewsItems;

public class ReorderNewsItemsCommandValidator : AbstractValidator<ReorderNewsItemsCommand>
{
    public ReorderNewsItemsCommandValidator()
    {
        RuleFor(command => command.NewsItemIds)
            .NotEmpty()
            .Must(ids => ids.Distinct().Count() == ids.Count)
            .WithMessage("NewsItemIds cannot contain duplicates.");
        RuleForEach(command => command.NewsItemIds).NotEmpty();
    }
}
